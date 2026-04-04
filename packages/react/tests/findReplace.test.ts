import { describe, it, expect, vi } from 'vitest';
import { computeMatches, buildPattern, findInTable } from '../src/plugins/findReplace.js';
import type { ResolvedColumn, TableContext } from '../src/types.js';
import type { Row } from '@unify/table-core';

function makeCols(...fields: string[]): ResolvedColumn[] {
  return fields.map((f) => ({ field: f, currentWidth: 100 })) as ResolvedColumn[];
}

function makeRows(...data: Record<string, unknown>[]): Row[] {
  return data as Row[];
}

describe('computeMatches', () => {
  const cols = makeCols('name', 'city');
  const rows = makeRows(
    { name: 'Alice', city: 'New York' },
    { name: 'Bob', city: 'Boston' },
    { name: 'alice', city: 'Albany' },
  );

  it('returns empty array for empty query', () => {
    expect(computeMatches(rows, cols, '', null, false)).toEqual([]);
  });

  it('finds case-insensitive matches by default', () => {
    const matches = computeMatches(rows, cols, 'alice', null, false);
    expect(matches).toHaveLength(2);
    expect(matches[0]).toEqual({ rowIndex: 0, colIndex: 0, field: 'name' });
    expect(matches[1]).toEqual({ rowIndex: 2, colIndex: 0, field: 'name' });
  });

  it('finds case-sensitive matches', () => {
    const matches = computeMatches(rows, cols, 'alice', null, true);
    expect(matches).toHaveLength(1);
    expect(matches[0].rowIndex).toBe(2);
  });

  it('searches across all columns', () => {
    const matches = computeMatches(rows, cols, 'bo', null, false);
    // "Bob" in name and "Boston" in city
    expect(matches).toHaveLength(2);
    expect(matches[0].field).toBe('name');
    expect(matches[1].field).toBe('city');
  });

  it('filters by specific column', () => {
    const matches = computeMatches(rows, cols, 'bo', 'city', false);
    expect(matches).toHaveLength(1);
    expect(matches[0].field).toBe('city');
  });

  it('handles null/undefined cell values', () => {
    const rowsWithNull = makeRows({ name: null, city: 'Test' }, { name: undefined, city: 'Test2' });
    const matches = computeMatches(rowsWithNull, cols, 'test', null, false);
    expect(matches).toHaveLength(2);
    expect(matches[0].field).toBe('city');
  });

  it('handles undefined rows (sparse array)', () => {
    const sparse: Row[] = [makeRows({ name: 'Alice' })[0]];
    sparse[2] = makeRows({ name: 'Bob' })[0];
    // sparse[1] is undefined
    const matches = computeMatches(sparse, makeCols('name'), 'a', null, false);
    expect(matches).toHaveLength(1);
    expect(matches[0].rowIndex).toBe(0);
  });

  it('returns no matches when query does not match', () => {
    expect(computeMatches(rows, cols, 'zzz', null, false)).toEqual([]);
  });

  it('matches partial strings', () => {
    const matches = computeMatches(rows, cols, 'ew', null, false);
    expect(matches).toHaveLength(1);
    expect(matches[0].field).toBe('city');
    expect(matches[0].rowIndex).toBe(0);
  });

  it('handles empty rows array', () => {
    expect(computeMatches([], cols, 'test', null, false)).toEqual([]);
  });

  it('handles empty columns array', () => {
    expect(computeMatches(rows, [], 'test', null, false)).toEqual([]);
  });
});

describe('buildPattern', () => {
  it('wraps plain text with wildcards and escapes', () => {
    expect(buildPattern('hello', false)).toBe("'%hello%'");
  });

  it('escapes single quotes', () => {
    expect(buildPattern("it's", false)).toBe("'%it''s%'");
  });

  it('escapes SQL wildcards', () => {
    expect(buildPattern('100%', false)).toBe("'%100\\%%'");
    expect(buildPattern('a_b', false)).toBe("'%a\\_b%'");
  });

  it('passes regex through escapeString', () => {
    const result = buildPattern('foo.*bar', true);
    // Regex mode uses escapeString which wraps in single quotes
    expect(result).toBe("'foo.*bar'");
  });

  it('escapes single quotes in regex mode', () => {
    const result = buildPattern("it's", true);
    expect(result).toBe("'it''s'");
  });
});

describe('findInTable', () => {
  function mockCtx(overrides: Partial<TableContext> = {}): TableContext {
    return {
      table: 'trades',
      engine: {
        columns: vi.fn().mockResolvedValue([
          { name: 'ticker', type: 'VARCHAR' },
          { name: 'price', type: 'DOUBLE' },
        ]),
        query: vi.fn().mockResolvedValue([{ cnt: 5 }]),
      },
      ...overrides,
    } as unknown as TableContext;
  }

  it('builds ILIKE query for plain text search', async () => {
    const ctx = mockCtx();
    const count = await findInTable(ctx, 'test');
    expect(count).toBe(5);
    const sql = (ctx.engine.query as any).mock.calls[0][0] as string;
    expect(sql).toContain('ILIKE');
    expect(sql).toContain("'%test%'");
    expect(sql).toContain("ESCAPE '\\'");
  });

  it('builds LIKE query for case-sensitive search', async () => {
    const ctx = mockCtx();
    await findInTable(ctx, 'test', undefined, false, true);
    const sql = (ctx.engine.query as any).mock.calls[0][0] as string;
    expect(sql).toContain(' LIKE ');
    expect(sql).not.toContain('ILIKE');
  });

  it('builds SIMILAR TO query for regex search', async () => {
    const ctx = mockCtx();
    await findInTable(ctx, 'foo.*', undefined, true);
    const sql = (ctx.engine.query as any).mock.calls[0][0] as string;
    expect(sql).toContain('SIMILAR TO');
    expect(sql).not.toContain("ESCAPE");
  });

  it('filters by specific column when provided', async () => {
    const ctx = mockCtx();
    await findInTable(ctx, 'test', 'ticker');
    const sql = (ctx.engine.query as any).mock.calls[0][0] as string;
    expect(sql).toContain('"ticker"');
    // Should not call engine.columns when column is specified
    expect(ctx.engine.columns).not.toHaveBeenCalled();
  });

  it('searches all columns when no column specified', async () => {
    const ctx = mockCtx();
    await findInTable(ctx, 'test');
    const sql = (ctx.engine.query as any).mock.calls[0][0] as string;
    expect(sql).toContain('"ticker"');
    expect(sql).toContain('"price"');
    expect(sql).toContain(' OR ');
  });

  it('returns 0 when no columns exist', async () => {
    const ctx = mockCtx({
      engine: {
        columns: vi.fn().mockResolvedValue([]),
        query: vi.fn(),
      } as any,
    });
    const count = await findInTable(ctx, 'test');
    expect(count).toBe(0);
  });

  it('casts columns to VARCHAR for comparison', async () => {
    const ctx = mockCtx();
    await findInTable(ctx, 'test', 'price');
    const sql = (ctx.engine.query as any).mock.calls[0][0] as string;
    expect(sql).toContain('CAST("price" AS VARCHAR)');
  });
});
