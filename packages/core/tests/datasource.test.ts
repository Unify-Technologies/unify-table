import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDataSource } from '../src/datasource.js';
import type { DataSource } from '../src/datasource.js';
import type { QueryEngine } from '../src/engine.js';
import { eq, gt } from '../src/sql/filters.js';

function mockEngine(opts: {
  rows?: Record<string, unknown>[];
  total?: number;
} = {}): QueryEngine {
  const rows = opts.rows ?? [{ id: 1 }, { id: 2 }];
  const total = opts.total ?? rows.length;

  return {
    query: vi.fn().mockResolvedValue(rows),
    execute: vi.fn().mockResolvedValue(undefined),
    columns: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(total),
    distinct: vi.fn().mockResolvedValue([]),
    exportBlob: vi.fn().mockResolvedValue(new Blob()),
  };
}

describe('DataSource', () => {
  describe('fetch', () => {
    it('returns rows and total count', async () => {
      const engine = mockEngine({ rows: [{ id: 1 }, { id: 2 }], total: 100 });
      const ds = createDataSource(engine, 'trades');

      const page = await ds.fetch({ offset: 0, limit: 50 });
      expect(page.rows).toEqual([{ id: 1 }, { id: 2 }]);
      expect(page.total).toBe(100);
    });

    it('passes LIMIT and OFFSET to query', async () => {
      const engine = mockEngine();
      const ds = createDataSource(engine, 'trades');

      await ds.fetch({ offset: 100, limit: 50 });
      expect(engine.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 50 OFFSET 100')
      );
    });

    it('queries the correct table', async () => {
      const engine = mockEngine();
      const ds = createDataSource(engine, 'my_table');

      await ds.fetch({ offset: 0, limit: 10 });
      expect(engine.query).toHaveBeenCalledWith(
        expect.stringContaining('"my_table"')
      );
    });
  });

  describe('sort', () => {
    it('starts with empty sort', () => {
      const ds = createDataSource(mockEngine(), 'trades');
      expect(ds.sort).toEqual([]);
    });

    it('applies sort to queries', async () => {
      const engine = mockEngine();
      const ds = createDataSource(engine, 'trades');

      ds.setSort([{ field: 'pnl', dir: 'desc' }]);
      // Wait for microtask flush
      await new Promise((r) => queueMicrotask(r));

      await ds.fetch({ offset: 0, limit: 50 });
      expect(engine.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY "pnl" DESC')
      );
    });

    it('applies multiple sort fields', async () => {
      const engine = mockEngine();
      const ds = createDataSource(engine, 'trades');

      ds.setSort([
        { field: 'region', dir: 'asc' },
        { field: 'pnl', dir: 'desc' },
      ]);
      await new Promise((r) => queueMicrotask(r));

      await ds.fetch({ offset: 0, limit: 50 });
      expect(engine.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY "region" ASC, "pnl" DESC')
      );
    });
  });

  describe('filters', () => {
    it('starts with empty filters', () => {
      const ds = createDataSource(mockEngine(), 'trades');
      expect(ds.filters).toEqual([]);
    });

    it('applies filters to queries', async () => {
      const engine = mockEngine();
      const ds = createDataSource(engine, 'trades');

      ds.setFilters([eq('region', 'EMEA')]);
      await new Promise((r) => queueMicrotask(r));

      await ds.fetch({ offset: 0, limit: 50 });
      expect(engine.query).toHaveBeenCalledWith(
        expect.stringContaining(`WHERE "region" = 'EMEA'`)
      );
    });

    it('applies multiple filters with AND', async () => {
      const engine = mockEngine();
      const ds = createDataSource(engine, 'trades');

      ds.setFilters([eq('region', 'EMEA'), gt('pnl', 0)]);
      await new Promise((r) => queueMicrotask(r));

      await ds.fetch({ offset: 0, limit: 50 });
      const sql = (engine.query as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(sql).toContain(`"region" = 'EMEA'`);
      expect(sql).toContain(`"pnl" > 0`);
    });

    it('passes filters to count', async () => {
      const engine = mockEngine();
      const ds = createDataSource(engine, 'trades');

      ds.setFilters([eq('region', 'EMEA')]);
      await new Promise((r) => queueMicrotask(r));

      await ds.fetch({ offset: 0, limit: 50 });
      expect(engine.count).toHaveBeenCalledWith('trades', `"region" = 'EMEA'`);
    });
  });

  describe('groupBy', () => {
    it('starts with empty groupBy', () => {
      const ds = createDataSource(mockEngine(), 'trades');
      expect(ds.groupBy).toEqual([]);
    });

    it('regular fetch does not include GROUP BY', async () => {
      const engine = mockEngine();
      const ds = createDataSource(engine, 'trades');

      ds.setGroupBy(['region']);
      await new Promise((r) => queueMicrotask(r));

      await ds.fetch({ offset: 0, limit: 50 });
      const sql = (engine.query as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(sql).not.toContain('GROUP BY');
    });
  });

  describe('events', () => {
    it('emits loading before fetch', async () => {
      const engine = mockEngine();
      const ds = createDataSource(engine, 'trades');
      const handler = vi.fn();

      ds.on('loading', handler);
      await ds.fetch({ offset: 0, limit: 50 });
      expect(handler).toHaveBeenCalled();
    });

    it('emits data after fetch', async () => {
      const engine = mockEngine({ rows: [{ id: 1 }], total: 1 });
      const ds = createDataSource(engine, 'trades');
      const handler = vi.fn();

      ds.on('data', handler);
      await ds.fetch({ offset: 0, limit: 50 });
      expect(handler).toHaveBeenCalledWith({ rows: [{ id: 1 }], total: 1 });
    });

    it('emits error on failure', async () => {
      const engine = mockEngine();
      (engine.count as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'));

      const ds = createDataSource(engine, 'trades');
      const handler = vi.fn();

      ds.on('error', handler);
      await expect(ds.fetch({ offset: 0, limit: 50 })).rejects.toThrow('boom');
      expect(handler).toHaveBeenCalled();
    });

    it('unsubscribe works', async () => {
      const engine = mockEngine();
      const ds = createDataSource(engine, 'trades');
      const handler = vi.fn();

      const unsub = ds.on('loading', handler);
      unsub();

      await ds.fetch({ offset: 0, limit: 50 });
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('version', () => {
    it('starts at 0', () => {
      const ds = createDataSource(mockEngine(), 'trades');
      expect(ds.version).toBe(0);
    });

    it('increments on state change', async () => {
      const ds = createDataSource(mockEngine(), 'trades');
      ds.setSort([{ field: 'pnl', dir: 'asc' }]);
      await new Promise((r) => queueMicrotask(r));
      expect(ds.version).toBe(1);
    });

    it('batches mutations in same microtask', async () => {
      const ds = createDataSource(mockEngine(), 'trades');
      ds.setSort([{ field: 'pnl', dir: 'asc' }]);
      ds.setFilters([eq('region', 'EMEA')]);
      ds.setGroupBy(['region']);
      await new Promise((r) => queueMicrotask(r));
      // All three mutations in one microtask = single version bump
      expect(ds.version).toBe(1);
    });
  });

  describe('combined state', () => {
    it('applies sort + filter together in fetch (groupBy excluded)', async () => {
      const engine = mockEngine();
      const ds = createDataSource(engine, 'trades');

      ds.setSort([{ field: 'pnl', dir: 'desc' }]);
      ds.setFilters([gt('pnl', 0)]);
      ds.setGroupBy(['region']);
      await new Promise((r) => queueMicrotask(r));

      await ds.fetch({ offset: 0, limit: 50 });
      const sql = (engine.query as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(sql).toContain('WHERE');
      expect(sql).not.toContain('GROUP BY');
      expect(sql).toContain('ORDER BY');
      expect(sql).toContain('LIMIT');
    });
  });

  describe('fetchGroups', () => {
    it('returns group summaries with counts', async () => {
      const engine = mockEngine();
      (engine.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([{ cnt: 2 }]) // count query
        .mockResolvedValueOnce([
          { region: 'US', __group_count: 5 },
          { region: 'EMEA', __group_count: 3 },
        ]);
      const ds = createDataSource(engine, 'trades');
      ds.setGroupBy(['region']);
      await new Promise((r) => queueMicrotask(r));

      const result = await ds.fetchGroups({ offset: 0, limit: 100 });
      expect(result.groups).toHaveLength(2);
      expect(result.groups[0].key).toEqual({ region: 'US' });
      expect(result.groups[0].count).toBe(5);
      expect(result.groups[1].key).toEqual({ region: 'EMEA' });
      expect(result.groups[1].count).toBe(3);
    });

    it('returns empty when no groupBy is set', async () => {
      const engine = mockEngine();
      const ds = createDataSource(engine, 'trades');

      const result = await ds.fetchGroups({ offset: 0, limit: 100 });
      expect(result.groups).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('includes GROUP BY sql', async () => {
      const engine = mockEngine();
      (engine.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([{ cnt: 1 }])
        .mockResolvedValueOnce([{ region: 'US', __group_count: 10 }]);
      const ds = createDataSource(engine, 'trades');
      ds.setGroupBy(['region']);
      await new Promise((r) => queueMicrotask(r));

      await ds.fetchGroups({ offset: 0, limit: 100 });
      const calls = (engine.query as ReturnType<typeof vi.fn>).mock.calls;
      // The group query should include GROUP BY
      const groupSql = calls[1][0];
      expect(groupSql).toContain('GROUP BY');
      expect(groupSql).toContain('__group_count');
    });

    it('applies ORDER BY for grouped column sort', async () => {
      const engine = mockEngine();
      (engine.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([{ cnt: 2 }])
        .mockResolvedValueOnce([
          { region: 'EMEA', __group_count: 3 },
          { region: 'US', __group_count: 5 },
        ]);
      const ds = createDataSource(engine, 'trades');
      ds.setGroupBy(['region']);
      ds.setSort([{ field: 'region', dir: 'desc' }]);
      await new Promise((r) => queueMicrotask(r));

      await ds.fetchGroups({ offset: 0, limit: 100 });
      const calls = (engine.query as ReturnType<typeof vi.fn>).mock.calls;
      const groupSql = calls[1][0];
      expect(groupSql).toContain('ORDER BY "region" DESC');
    });

    it('falls back to groupBy columns for ORDER BY when sort is on non-grouped columns', async () => {
      const engine = mockEngine();
      (engine.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([{ cnt: 1 }])
        .mockResolvedValueOnce([{ region: 'US', __group_count: 10 }]);
      const ds = createDataSource(engine, 'trades');
      ds.setGroupBy(['region']);
      ds.setSort([{ field: 'price', dir: 'asc' }]);
      await new Promise((r) => queueMicrotask(r));

      await ds.fetchGroups({ offset: 0, limit: 100 });
      const calls = (engine.query as ReturnType<typeof vi.fn>).mock.calls;
      const groupSql = calls[1][0];
      // Even though sort is on 'price' (not a grouped column), groupBy columns
      // should still appear in ORDER BY with default ASC direction
      expect(groupSql).toContain('ORDER BY "region" ASC');
    });

    it('sorts by aggregate alias when sorting an aggregated column', async () => {
      const engine = mockEngine();
      (engine.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([{ cnt: 2 }])
        .mockResolvedValueOnce([
          { region: 'EMEA', __group_count: 3, __agg_price: 100 },
          { region: 'US', __group_count: 5, __agg_price: 200 },
        ]);
      const ds = createDataSource(engine, 'trades');
      ds.setGroupBy(['region']);
      ds.setSort([{ field: 'price', dir: 'desc' }]);
      await new Promise((r) => queueMicrotask(r));

      await ds.fetchGroups({ offset: 0, limit: 100 }, [{ field: 'price', fn: 'sum' }]);
      const calls = (engine.query as ReturnType<typeof vi.fn>).mock.calls;
      const groupSql = calls[1][0];
      expect(groupSql).toContain('ORDER BY "__agg_price" DESC');
    });
  });

  describe('fetchGroups hierarchical', () => {
    it('fetches only top-level groups when depth=0 with multi-column groupBy', async () => {
      const engine = mockEngine();
      (engine.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([{ cnt: 3 }])
        .mockResolvedValueOnce([
          { region: 'US', __group_count: 100 },
          { region: 'EMEA', __group_count: 80 },
          { region: 'APAC', __group_count: 60 },
        ]);
      const ds = createDataSource(engine, 'trades');
      ds.setGroupBy(['region', 'ticker']);
      await new Promise((r) => queueMicrotask(r));

      const result = await ds.fetchGroups({ offset: 0, limit: 100 }, [], { depth: 0 });
      expect(result.groups).toHaveLength(3);
      // Group key should only contain the depth-0 field
      expect(result.groups[0].key).toEqual({ region: 'US' });
      expect(Object.keys(result.groups[0].key)).toEqual(['region']);

      // SQL should GROUP BY only "region", not "region", "ticker"
      const groupSql = (engine.query as ReturnType<typeof vi.fn>).mock.calls[1][0];
      expect(groupSql).toContain('GROUP BY "region"');
      expect(groupSql).not.toContain('"ticker"');
    });

    it('fetches sub-groups at depth=1 with ancestor keys', async () => {
      const engine = mockEngine();
      (engine.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([{ cnt: 5 }])
        .mockResolvedValueOnce([
          { region: 'US', ticker: 'AAPL', __group_count: 30 },
          { region: 'US', ticker: 'GOOG', __group_count: 40 },
          { region: 'US', ticker: 'MSFT', __group_count: 30 },
        ]);
      const ds = createDataSource(engine, 'trades');
      ds.setGroupBy(['region', 'ticker']);
      await new Promise((r) => queueMicrotask(r));

      const result = await ds.fetchGroups(
        { offset: 0, limit: 100 },
        [],
        { depth: 1, ancestorKeys: { region: 'US' } },
      );
      expect(result.groups).toHaveLength(3);
      expect(result.groups[0].key).toEqual({ region: 'US', ticker: 'AAPL' });

      // SQL should include WHERE "region" = 'US' AND GROUP BY "region", "ticker"
      const groupSql = (engine.query as ReturnType<typeof vi.fn>).mock.calls[1][0];
      expect(groupSql).toContain('GROUP BY "region", "ticker"');
      expect(groupSql).toContain(`"region" = 'US'`);
    });

    it('defaults to flat grouping when no depth is specified', async () => {
      const engine = mockEngine();
      (engine.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([{ cnt: 1 }])
        .mockResolvedValueOnce([
          { region: 'US', ticker: 'AAPL', __group_count: 10 },
        ]);
      const ds = createDataSource(engine, 'trades');
      ds.setGroupBy(['region', 'ticker']);
      await new Promise((r) => queueMicrotask(r));

      await ds.fetchGroups({ offset: 0, limit: 100 });
      const groupSql = (engine.query as ReturnType<typeof vi.fn>).mock.calls[1][0];
      // Without depth option, should group by all columns (backward compat)
      expect(groupSql).toContain('GROUP BY "region", "ticker"');
    });

    it('handles null ancestor key values', async () => {
      const engine = mockEngine();
      (engine.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([{ cnt: 1 }])
        .mockResolvedValueOnce([
          { region: null, ticker: 'AAPL', __group_count: 5 },
        ]);
      const ds = createDataSource(engine, 'trades');
      ds.setGroupBy(['region', 'ticker']);
      await new Promise((r) => queueMicrotask(r));

      await ds.fetchGroups(
        { offset: 0, limit: 100 },
        [],
        { depth: 1, ancestorKeys: { region: null } },
      );
      const groupSql = (engine.query as ReturnType<typeof vi.fn>).mock.calls[1][0];
      expect(groupSql).toContain('"region" IS NULL');
    });

    it('combines ancestor keys with existing filters', async () => {
      const engine = mockEngine();
      (engine.query as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([{ cnt: 1 }])
        .mockResolvedValueOnce([
          { region: 'US', ticker: 'AAPL', __group_count: 3 },
        ]);
      const ds = createDataSource(engine, 'trades');
      ds.setGroupBy(['region', 'ticker']);
      ds.setFilters([gt('pnl', 0)]);
      await new Promise((r) => queueMicrotask(r));

      await ds.fetchGroups(
        { offset: 0, limit: 100 },
        [],
        { depth: 1, ancestorKeys: { region: 'US' } },
      );
      const groupSql = (engine.query as ReturnType<typeof vi.fn>).mock.calls[1][0];
      expect(groupSql).toContain(`"region" = 'US'`);
      expect(groupSql).toContain('"pnl" > 0');
    });
  });

  describe('fetchGroupDetail', () => {
    it('fetches detail rows for a group key', async () => {
      const detailRows = [
        { id: 1, ticker: 'AAPL', region: 'US' },
        { id: 2, ticker: 'MSFT', region: 'US' },
      ];
      const engine = mockEngine({ rows: detailRows, total: 2 });
      const ds = createDataSource(engine, 'trades');

      const result = await ds.fetchGroupDetail({ region: 'US' }, { offset: 0, limit: 100 });
      expect(result.rows).toHaveLength(2);
      expect(result.total).toBe(2);

      // Should have WHERE clause with the group key
      const queryCalls = (engine.query as ReturnType<typeof vi.fn>).mock.calls;
      const sql = queryCalls[0][0];
      expect(sql).toContain("\"region\" = 'US'");
    });

    it('handles null values in group key', async () => {
      const engine = mockEngine({ rows: [], total: 0 });
      const ds = createDataSource(engine, 'trades');

      await ds.fetchGroupDetail({ region: null }, { offset: 0, limit: 100 });
      const sql = (engine.query as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(sql).toContain('"region" IS NULL');
    });

    it('handles numeric values in group key', async () => {
      const engine = mockEngine({ rows: [], total: 0 });
      const ds = createDataSource(engine, 'trades');

      await ds.fetchGroupDetail({ year: 2024 }, { offset: 0, limit: 100 });
      const sql = (engine.query as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(sql).toContain('"year" = 2024');
    });

    it('combines group key conditions with existing filters', async () => {
      const engine = mockEngine({ rows: [], total: 0 });
      const ds = createDataSource(engine, 'trades');
      ds.setFilters([gt('pnl', 0)]);
      await new Promise((r) => queueMicrotask(r));

      await ds.fetchGroupDetail({ region: 'US' }, { offset: 0, limit: 100 });
      const sql = (engine.query as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(sql).toContain("\"region\" = 'US'");
      expect(sql).toContain('AND');
    });
  });
});
