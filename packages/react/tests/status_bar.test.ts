import { describe, it, expect } from 'vitest';
import { buildAggSql, getNumericFields, getSelectionDims } from '../src/plugins/status_bar.js';
import type { TableContext, ResolvedColumn, SelectionState } from '../src/types.js';

describe('buildAggSql', () => {
  it('builds SQL for a single numeric field with row IDs', () => {
    const sql = buildAggSql('v_table_0', ['price'], ['sum', 'avg', 'min', 'max'], 'id', ['1', '2', '3']);
    expect(sql).toContain('SUM("price")');
    expect(sql).toContain('AVG("price")');
    expect(sql).toContain('MIN("price")');
    expect(sql).toContain('MAX("price")');
    expect(sql).toContain('FROM "v_table_0"');
    expect(sql).toContain('WHERE "id" IN (1, 2, 3)');
  });

  it('builds SQL without WHERE clause when rowIds is null', () => {
    const sql = buildAggSql('v_table_0', ['price'], ['sum'], 'id', null);
    expect(sql).toBe('SELECT SUM("price") AS "sum_price" FROM "v_table_0"');
  });

  it('handles multiple numeric fields', () => {
    const sql = buildAggSql('trades', ['price', 'volume'], ['sum', 'avg'], 'id', null);
    expect(sql).toContain('SUM("price") AS "sum_price"');
    expect(sql).toContain('AVG("price") AS "avg_price"');
    expect(sql).toContain('SUM("volume") AS "sum_volume"');
    expect(sql).toContain('AVG("volume") AS "avg_volume"');
  });

  it('handles string row IDs', () => {
    const sql = buildAggSql('v_table_0', ['price'], ['sum'], 'id', ['abc', 'def']);
    expect(sql).toContain("WHERE \"id\" IN ('abc', 'def')");
  });

  it('handles count aggregation', () => {
    const sql = buildAggSql('trades', ['price'], ['count'], 'id', null);
    expect(sql).toContain('COUNT("price") AS "count_price"');
  });
});

describe('getNumericFields', () => {
  it('detects numeric fields from selected cells', () => {
    const ctx = {
      selection: {
        selectedCells: [
          { rowIndex: 0, colIndex: 0, rowId: '1', field: 'id', value: 1 },
          { rowIndex: 0, colIndex: 1, rowId: '1', field: 'price', value: 100 },
          { rowIndex: 0, colIndex: 2, rowId: '1', field: 'name', value: 'test' },
        ],
      },
      columns: [
        { field: 'id', currentWidth: 80, columnInfo: { name: 'id', type: 'INTEGER', mappedType: 'number', nullable: false } },
        { field: 'price', currentWidth: 100, columnInfo: { name: 'price', type: 'DOUBLE', mappedType: 'number', nullable: true } },
        { field: 'name', currentWidth: 150, columnInfo: { name: 'name', type: 'VARCHAR', mappedType: 'string', nullable: true } },
      ] as ResolvedColumn[],
    } as unknown as TableContext;

    const fields = getNumericFields(ctx);
    expect(fields).toContain('id');
    expect(fields).toContain('price');
    expect(fields).not.toContain('name');
  });

  it('detects bigint fields as numeric', () => {
    const ctx = {
      selection: {
        selectedCells: [
          { rowIndex: 0, colIndex: 0, rowId: '1', field: 'big_num', value: 99999 },
        ],
      },
      columns: [
        { field: 'big_num', currentWidth: 100, columnInfo: { name: 'big_num', type: 'BIGINT', mappedType: 'bigint', nullable: false } },
      ] as ResolvedColumn[],
    } as unknown as TableContext;

    const fields = getNumericFields(ctx);
    expect(fields).toEqual(['big_num']);
  });

  it('returns empty array when no numeric columns selected', () => {
    const ctx = {
      selection: {
        selectedCells: [
          { rowIndex: 0, colIndex: 0, rowId: '1', field: 'name', value: 'test' },
        ],
      },
      columns: [
        { field: 'name', currentWidth: 150, columnInfo: { name: 'name', type: 'VARCHAR', mappedType: 'string', nullable: true } },
      ] as ResolvedColumn[],
    } as unknown as TableContext;

    expect(getNumericFields(ctx)).toEqual([]);
  });

  it('handles columns without columnInfo', () => {
    const ctx = {
      selection: {
        selectedCells: [
          { rowIndex: 0, colIndex: 0, rowId: '1', field: 'unknown', value: 42 },
        ],
      },
      columns: [
        { field: 'unknown', currentWidth: 100 },
      ] as ResolvedColumn[],
    } as unknown as TableContext;

    expect(getNumericFields(ctx)).toEqual([]);
  });
});

describe('getSelectionDims', () => {
  it('returns zero for no selection', () => {
    const ctx = {
      selection: { span: null, additionalSpans: [] } as unknown as SelectionState,
    } as unknown as TableContext;
    expect(getSelectionDims(ctx)).toEqual({ rows: 0, cols: 0 });
  });

  it('returns correct dimensions for a single span', () => {
    const ctx = {
      selection: {
        span: { anchor: { row: 1, col: 0 }, focus: { row: 3, col: 2 } },
        additionalSpans: [],
      } as unknown as SelectionState,
    } as unknown as TableContext;
    expect(getSelectionDims(ctx)).toEqual({ rows: 3, cols: 3 });
  });

  it('handles reversed span (focus before anchor)', () => {
    const ctx = {
      selection: {
        span: { anchor: { row: 5, col: 3 }, focus: { row: 2, col: 1 } },
        additionalSpans: [],
      } as unknown as SelectionState,
    } as unknown as TableContext;
    expect(getSelectionDims(ctx)).toEqual({ rows: 4, cols: 3 });
  });

  it('handles additional spans', () => {
    const ctx = {
      selection: {
        span: { anchor: { row: 0, col: 0 }, focus: { row: 1, col: 1 } },
        additionalSpans: [
          { anchor: { row: 5, col: 0 }, focus: { row: 7, col: 3 } },
        ],
      } as unknown as SelectionState,
    } as unknown as TableContext;
    const dims = getSelectionDims(ctx);
    expect(dims).toEqual({ rows: 8, cols: 4 });
  });
});
