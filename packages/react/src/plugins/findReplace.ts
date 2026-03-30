import type { TablePlugin, TableContext } from '../types.js';
import { quoteIdent, escapeString } from '@unify/table-core';

export function findReplace(): TablePlugin {
  return {
    name: 'findReplace',
    dependencies: [],

    shortcuts: {
      'Ctrl+f': (ctx) => {
        ctx.emit('findReplace:open');
      },
      'Ctrl+h': (ctx) => {
        ctx.emit('findReplace:openReplace');
      },
      Escape: (ctx) => {
        ctx.emit('findReplace:close');
      },
    },

    init(ctx: TableContext) {
      const el = ctx.containerRef.current;
      if (!el) return;

      const handler = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
          e.preventDefault();
          ctx.emit('findReplace:open');
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
          e.preventDefault();
          ctx.emit('findReplace:openReplace');
        }
      };

      el.addEventListener('keydown', handler);
      return () => el.removeEventListener('keydown', handler);
    },
  };
}

/** Build the escaped ILIKE/SIMILAR TO pattern string. */
function buildPattern(query: string, useRegex: boolean): string {
  if (useRegex) return escapeString(query);
  const escaped = query.replace(/'/g, "''").replace(/%/g, '\\%').replace(/_/g, '\\_');
  return `'%${escaped}%'`;
}

/** Helper to search via SQL */
export async function findInTable(
  ctx: TableContext,
  query: string,
  column?: string,
  useRegex = false,
): Promise<number> {
  const { engine, table } = ctx;
  const pattern = buildPattern(query, useRegex);
  const operator = useRegex ? 'SIMILAR TO' : 'ILIKE';
  const escape = useRegex ? '' : " ESCAPE '\\'";

  let sql: string;
  if (column) {
    sql = `SELECT COUNT(*) AS cnt FROM ${quoteIdent(table)} WHERE ${quoteIdent(column)} ${operator} ${pattern}${escape}`;
  } else {
    const cols = await engine.columns(table);
    const textCols = cols.filter((c) => c.mappedType === 'string');
    if (textCols.length === 0) return 0;
    const conditions = textCols
      .map((c) => `${quoteIdent(c.name)} ${operator} ${pattern}${escape}`)
      .join(' OR ');
    sql = `SELECT COUNT(*) AS cnt FROM ${quoteIdent(table)} WHERE ${conditions}`;
  }

  const rows = await engine.query<{ cnt: number }>(sql);
  return Number(rows[0]?.cnt ?? 0);
}

/** Helper to replace via SQL */
export async function replaceInTable(
  ctx: TableContext,
  query: string,
  replacement: string,
  column: string,
): Promise<number> {
  const { engine, table } = ctx;
  const qt = quoteIdent(table);
  const qc = quoteIdent(column);
  const escapedQuery = query.replace(/'/g, "''").replace(/%/g, '\\%').replace(/_/g, '\\_');
  const whereClause = `${qc} ILIKE '%${escapedQuery}%' ESCAPE '\\'`;

  const countSql = `SELECT COUNT(*) AS cnt FROM ${qt} WHERE ${whereClause}`;
  const countRows = await engine.query<{ cnt: number }>(countSql);
  const affected = Number(countRows[0]?.cnt ?? 0);

  if (affected > 0) {
    const sql = `UPDATE ${qt} SET ${qc} = REPLACE(${qc}, ${escapeString(query)}, ${escapeString(replacement)}) WHERE ${whereClause}`;
    await engine.execute(sql);
    await ctx.refresh();
  }

  return affected;
}
