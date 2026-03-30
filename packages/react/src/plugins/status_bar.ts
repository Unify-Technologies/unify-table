import { createElement, useState, useEffect, useRef } from 'react';
import type { TablePlugin, TableContext } from '../types.js';
import { quoteIdent, toSqlLiteral } from '@unify/table-core';
import { detectIdColumn } from '../utils.js';

type AggKind = 'sum' | 'avg' | 'min' | 'max' | 'count';

export interface StatusBarOptions {
  /** Which aggregations to show. Default: ['sum', 'avg', 'min', 'max'] */
  aggregations?: AggKind[];
  /** Debounce delay in ms for aggregation queries. Default: 150 */
  debounceMs?: number;
}

interface AggResult {
  [key: string]: number | null;
}

const DEFAULT_AGGS: AggKind[] = ['sum', 'avg', 'min', 'max'];
const NUMERIC_TYPES = new Set(['number', 'bigint']);

/** Build aggregation SQL for selected numeric fields. */
export function buildAggSql(
  viewName: string,
  numericFields: string[],
  aggs: AggKind[],
  idCol: string,
  rowIds: string[] | null,
): string {
  const aggCols = numericFields.flatMap((field) =>
    aggs.map((agg) => `${agg.toUpperCase()}(${quoteIdent(field)}) AS ${quoteIdent(`${agg}_${field}`)}`),
  );
  const select = `SELECT ${aggCols.join(', ')} FROM ${quoteIdent(viewName)}`;
  if (!rowIds) return select;
  const idList = rowIds.map((id) => toSqlLiteral(Number.isNaN(Number(id)) ? id : Number(id))).join(', ');
  return `${select} WHERE ${quoteIdent(idCol)} IN (${idList})`;
}

/** Detect numeric fields from selected cells. */
export function getNumericFields(ctx: TableContext): string[] {
  const fields = new Set<string>();
  for (const cell of ctx.selection.selectedCells) {
    const col = ctx.columns[cell.colIndex];
    if (col?.columnInfo && NUMERIC_TYPES.has(col.columnInfo.mappedType)) {
      fields.add(col.field);
    }
  }
  return [...fields];
}

/** Get selection dimensions from spans. */
export function getSelectionDims(ctx: TableContext): { rows: number; cols: number } {
  const sel = ctx.selection;
  if (!sel.span) return { rows: 0, cols: 0 };
  const allSpans = [sel.span, ...sel.additionalSpans];
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
  for (const s of allSpans) {
    minR = Math.min(minR, s.anchor.row, s.focus.row);
    maxR = Math.max(maxR, s.anchor.row, s.focus.row);
    minC = Math.min(minC, s.anchor.col, s.focus.col);
    maxC = Math.max(maxC, s.anchor.col, s.focus.col);
  }
  return { rows: maxR - minR + 1, cols: maxC - minC + 1 };
}

function formatAgg(value: number | null): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'bigint') return Number(value).toLocaleString();
  return typeof value === 'number'
    ? (Math.abs(value) >= 1000 || (Math.abs(value) > 0 && Math.abs(value) < 0.01))
      ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : value.toLocaleString(undefined, { maximumFractionDigits: 4 })
    : String(value);
}

const AGG_LABELS: Record<AggKind, string> = {
  sum: 'Sum',
  avg: 'Avg',
  min: 'Min',
  max: 'Max',
  count: 'Count',
};

function StatusBarFooter({ ctx, options }: { ctx: TableContext; options: StatusBarOptions }) {
  const aggs = options.aggregations ?? DEFAULT_AGGS;
  const debounceMs = options.debounceMs ?? 150;
  const [aggResult, setAggResult] = useState<AggResult | null>(null);
  const [computing, setComputing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(0);

  const { totalCount, isLoading, selection } = ctx;
  const hasSel = selection.count > 0;
  const dims = hasSel ? getSelectionDims(ctx) : { rows: 0, cols: 0 };
  const numericFields = hasSel ? getNumericFields(ctx) : [];

  useEffect(() => {
    if (!hasSel || numericFields.length === 0) {
      setAggResult(null);
      setComputing(false);
      return;
    }

    setComputing(true);
    if (timerRef.current) clearTimeout(timerRef.current);

    const queryId = ++abortRef.current;

    timerRef.current = setTimeout(async () => {
      try {
        const idCol = detectIdColumn(ctx.columns);
        const rowIds = selection.count <= 1000 && selection.count < totalCount
          ? [...selection.selectedIds]
          : null;
        const sql = buildAggSql(ctx.viewName, numericFields, aggs, idCol, rowIds);
        const rows = await ctx.engine.query<AggResult>(sql);
        if (abortRef.current !== queryId) return;
        setAggResult(rows[0] ?? null);
      } catch {
        if (abortRef.current !== queryId) return;
        setAggResult(null);
      } finally {
        if (abortRef.current === queryId) setComputing(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection.count, selection.span?.anchor.row, selection.span?.focus.row, numericFields.join(',')]);

  // Left: total rows + selection dims
  const leftParts: React.ReactNode[] = [
    createElement('span', { key: 'total' }, isLoading ? 'Loading...' : `${totalCount.toLocaleString()} rows`),
  ];
  if (hasSel) {
    leftParts.push(
      createElement('span', { key: 'sel', style: { opacity: 0.7 } },
        `${dims.rows.toLocaleString()} rows \u00D7 ${dims.cols} cols`,
      ),
    );
  }

  // Right: aggregations
  let rightSection: React.ReactNode = null;
  if (hasSel && numericFields.length > 0) {
    if (computing && !aggResult) {
      rightSection = createElement('span', { key: 'computing', style: { opacity: 0.5 } }, 'computing...');
    } else if (aggResult) {
      const parts: React.ReactNode[] = [];
      if (numericFields.length === 1) {
        const field = numericFields[0];
        for (const agg of aggs) {
          const val = aggResult[`${agg}_${field}`];
          if (val !== null && val !== undefined) {
            parts.push(
              createElement('span', { key: `${agg}_${field}` }, [
                `${AGG_LABELS[agg]}: `,
                createElement('span', { key: 'v', 'data-agg-value': true }, formatAgg(val as number)),
              ]),
            );
          }
        }
      } else {
        for (const agg of aggs) {
          let combined = 0;
          let hasValue = false;
          for (const field of numericFields) {
            const val = aggResult[`${agg}_${field}`] as number | null;
            if (val !== null && val !== undefined) {
              combined += val;
              hasValue = true;
            }
          }
          if (hasValue) {
            parts.push(
              createElement('span', { key: agg }, [
                `${AGG_LABELS[agg]}: `,
                createElement('span', { key: 'v', 'data-agg-value': true }, formatAgg(agg === 'avg' ? combined / numericFields.length : combined)),
              ]),
            );
          }
        }
      }
      rightSection = createElement(
        'span',
        { key: 'aggs', style: { display: 'flex', gap: 12, opacity: computing ? 0.5 : 1, transition: 'opacity 0.15s' } },
        parts,
      );
    }
  }

  return createElement(
    'div',
    {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        gap: 16,
      },
    },
    [
      createElement('span', { key: 'left', style: { display: 'flex', gap: 16 } }, leftParts),
      rightSection,
    ].filter(Boolean),
  );
}

export function statusBar(options?: StatusBarOptions): TablePlugin {
  return {
    name: 'statusBar',
    renderFooter(ctx: TableContext) {
      return createElement(StatusBarFooter, { ctx, options: options ?? {} });
    },
  };
}
