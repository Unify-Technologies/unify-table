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

  it('includes extra SELECT expressions for formula columns', () => {
    const sql = buildViewSelect('trades', [], [], [
      { expression: 'ROUND(pnl / NULLIF(volume, 0), 4)', alias: 'pnl_per_unit' },
      { expression: "DATE_PART('year', trade_date)::INTEGER", alias: 'trade_year' },
    ]);
    expect(sql).toBe(
      `SELECT *, (ROUND(pnl / NULLIF(volume, 0), 4)) AS "pnl_per_unit", (DATE_PART('year', trade_date)::INTEGER) AS "trade_year" FROM "trades"`,
    );
  });

  it('combines extra expressions with filters and sort', () => {
    const sql = buildViewSelect(
      'trades',
      [eq('region', 'US')],
      [{ field: 'pnl', dir: 'desc' }],
      [{ expression: 'price * quantity', alias: 'total' }],
    );
    expect(sql).toBe(
      `SELECT *, (price * quantity) AS "total" FROM "trades" WHERE "region" = 'US' ORDER BY "pnl" DESC`,
    );
  });

  it('handles empty extra expressions array', () => {
    const sql = buildViewSelect('trades', [], [], []);
    expect(sql).toBe('SELECT * FROM "trades"');
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

  it('setBaseTable changes the table used in subsequent sync calls', async () => {
    const engine = mockEngine();
    const vm = createViewManager(engine, 'trades', '0');

    // Initial sync uses 'trades'
    await vm.sync([], []);
    expect(engine.execute).toHaveBeenCalledWith(
      'CREATE OR REPLACE VIEW "__utbl_v_0" AS SELECT * FROM "trades"',
    );

    // Change base table to an edit overlay view
    vm.setBaseTable('__utbl_ev_0');
    await vm.sync([], []);
    expect(engine.execute).toHaveBeenCalledWith(
      'CREATE OR REPLACE VIEW "__utbl_v_0" AS SELECT * FROM "__utbl_ev_0"',
    );
  });

  it('setBaseTable applies to sync with filters and sort', async () => {
    const engine = mockEngine();
    const vm = createViewManager(engine, 'trades', '1');

    vm.setBaseTable('__utbl_ev_1');
    await vm.sync([eq('region', 'US')], [{ field: 'pnl', dir: 'desc' }]);

    expect(engine.execute).toHaveBeenCalledWith(
      `CREATE OR REPLACE VIEW "__utbl_v_1" AS SELECT * FROM "__utbl_ev_1" WHERE "region" = 'US' ORDER BY "pnl" DESC`,
    );
  });

  it('setSelectExpressions includes formula columns in sync', async () => {
    const engine = mockEngine();
    const vm = createViewManager(engine, 'trades', '5');

    vm.setSelectExpressions([
      { expression: 'price * quantity', alias: 'total' },
    ]);
    await vm.sync([], []);

    expect(engine.execute).toHaveBeenCalledWith(
      'CREATE OR REPLACE VIEW "__utbl_v_5" AS SELECT *, (price * quantity) AS "total" FROM "trades"',
    );
  });

  it('setSelectExpressions persists across multiple sync calls', async () => {
    const engine = mockEngine();
    const vm = createViewManager(engine, 'trades', '6');

    vm.setSelectExpressions([{ expression: 'a + b', alias: 'sum' }]);
    await vm.sync([], []);
    await vm.sync([eq('region', 'US')], []);

    expect(engine.execute).toHaveBeenLastCalledWith(
      `CREATE OR REPLACE VIEW "__utbl_v_6" AS SELECT *, (a + b) AS "sum" FROM "trades" WHERE "region" = 'US'`,
    );
  });

  it('setSelectExpressions works after setBaseTable (editing compat)', async () => {
    const engine = mockEngine();
    const vm = createViewManager(engine, 'trades', '7');

    vm.setSelectExpressions([{ expression: 'pnl / volume', alias: 'ratio' }]);
    vm.setBaseTable('__utbl_ev_7');
    await vm.sync([], []);

    expect(engine.execute).toHaveBeenCalledWith(
      'CREATE OR REPLACE VIEW "__utbl_v_7" AS SELECT *, (pnl / volume) AS "ratio" FROM "__utbl_ev_7"',
    );
  });

  it('setSelectExpressions can be cleared', async () => {
    const engine = mockEngine();
    const vm = createViewManager(engine, 'trades', '8');

    vm.setSelectExpressions([{ expression: 'a + b', alias: 'sum' }]);
    await vm.sync([], []);
    vm.setSelectExpressions([]);
    await vm.sync([], []);

    expect(engine.execute).toHaveBeenLastCalledWith(
      'CREATE OR REPLACE VIEW "__utbl_v_8" AS SELECT * FROM "trades"',
    );
  });
});
