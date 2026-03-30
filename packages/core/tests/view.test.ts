import { describe, it, expect, vi } from 'vitest';
import { createViewManager, buildViewSelect } from '../src/view.js';
import type { QueryEngine } from '../src/engine.js';
import { eq, gt } from '../src/sql/filters.js';

function mockEngine(): QueryEngine {
  return {
    query: vi.fn().mockResolvedValue([]),
    execute: vi.fn().mockResolvedValue(undefined),
    columns: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
    distinct: vi.fn().mockResolvedValue([]),
    exportBlob: vi.fn().mockResolvedValue(new Blob()),
  };
}

describe('buildViewSelect', () => {
  it('builds SELECT * FROM table with no filters or sort', () => {
    expect(buildViewSelect('trades', [], [])).toBe('SELECT * FROM "trades"');
  });

  it('includes WHERE clause for filters', () => {
    const sql = buildViewSelect('trades', [eq('region', 'EMEA')], []);
    expect(sql).toBe(`SELECT * FROM "trades" WHERE "region" = 'EMEA'`);
  });

  it('includes ORDER BY for sort', () => {
    const sql = buildViewSelect('trades', [], [{ field: 'pnl', dir: 'desc' }]);
    expect(sql).toBe('SELECT * FROM "trades" ORDER BY "pnl" DESC');
  });

  it('combines filters and sort', () => {
    const sql = buildViewSelect(
      'trades',
      [eq('region', 'US'), gt('pnl', 0)],
      [{ field: 'pnl', dir: 'desc' }, { field: 'id', dir: 'asc' }],
    );
    expect(sql).toBe(
      `SELECT * FROM "trades" WHERE "region" = 'US' AND "pnl" > 0 ORDER BY "pnl" DESC, "id" ASC`,
    );
  });

  it('escapes table names with special characters', () => {
    const sql = buildViewSelect('my "table"', [], []);
    expect(sql).toBe('SELECT * FROM "my ""table"""');
  });
});

describe('ViewManager', () => {
  it('has a deterministic view name', () => {
    const vm = createViewManager(mockEngine(), 'trades', '0');
    expect(vm.viewName).toBe('__utbl_v_0');
  });

  it('starts with empty viewSql', () => {
    const vm = createViewManager(mockEngine(), 'trades', '0');
    expect(vm.viewSql).toBe('');
  });

  it('sync creates a view via engine.execute', async () => {
    const engine = mockEngine();
    const vm = createViewManager(engine, 'trades', '42');

    await vm.sync([], []);
    expect(engine.execute).toHaveBeenCalledWith(
      'CREATE OR REPLACE VIEW "__utbl_v_42" AS SELECT * FROM "trades"',
    );
  });

  it('sync includes filters and sort in the view', async () => {
    const engine = mockEngine();
    const vm = createViewManager(engine, 'trades', '1');

    await vm.sync(
      [eq('region', 'EMEA'), gt('pnl', 100)],
      [{ field: 'pnl', dir: 'desc' }],
    );

    expect(engine.execute).toHaveBeenCalledWith(
      `CREATE OR REPLACE VIEW "__utbl_v_1" AS SELECT * FROM "trades" WHERE "region" = 'EMEA' AND "pnl" > 100 ORDER BY "pnl" DESC`,
    );
    expect(vm.viewSql).toContain('CREATE OR REPLACE VIEW');
  });

  it('drop removes the view', async () => {
    const engine = mockEngine();
    const vm = createViewManager(engine, 'trades', '0');

    await vm.sync([], []);
    await vm.drop();

    expect(engine.execute).toHaveBeenCalledWith('DROP VIEW IF EXISTS "__utbl_v_0"');
    expect(vm.viewSql).toBe('');
  });

  it('sync overwrites previous view on subsequent calls', async () => {
    const engine = mockEngine();
    const vm = createViewManager(engine, 'trades', '0');

    await vm.sync([], []);
    await vm.sync([eq('region', 'US')], []);

    expect(engine.execute).toHaveBeenCalledTimes(2);
    expect(vm.viewSql).toContain(`"region" = 'US'`);
  });
});
