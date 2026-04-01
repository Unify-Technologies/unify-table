import { describe, it, expect, vi } from 'vitest';
import { createEditOverlay } from '../src/edit_overlay.js';
import type { QueryEngine, ColumnInfo } from '../src/engine.js';

function mockEngine(): QueryEngine & { execute: ReturnType<typeof vi.fn>; query: ReturnType<typeof vi.fn> } {
  return {
    query: vi.fn().mockResolvedValue([]),
    execute: vi.fn().mockResolvedValue(undefined),
    columns: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
    distinct: vi.fn().mockResolvedValue([]),
    exportBlob: vi.fn().mockResolvedValue(new Blob()),
  };
}

const testColumns: ColumnInfo[] = [
  { name: 'id', type: 'INTEGER', mappedType: 'number', nullable: false },
  { name: 'name', type: 'VARCHAR', mappedType: 'string', nullable: true },
  { name: 'price', type: 'DOUBLE', mappedType: 'number', nullable: true },
];

describe('EditOverlay', () => {
  it('has deterministic table and view names', () => {
    const ov = createEditOverlay(mockEngine(), 'trades', '0');
    expect(ov.overlayTable).toBe('__utbl_ov_0');
    expect(ov.viewName).toBe('__utbl_ev_0');
  });

  it('init creates overlay table, adds state column, and creates merge view', async () => {
    const engine = mockEngine();
    const ov = createEditOverlay(engine, 'trades', '1');

    await ov.init(testColumns, 'id');

    const calls = engine.execute.mock.calls.map((c: unknown[]) => c[0]);
    // Should create table
    expect(calls[0]).toBe('CREATE TABLE IF NOT EXISTS "__utbl_ov_1" AS SELECT * FROM "trades" WHERE false');
    // Should add state column
    expect(calls[1]).toBe('ALTER TABLE "__utbl_ov_1" ADD COLUMN IF NOT EXISTS "__utbl_state" VARCHAR DEFAULT \'edited\'');
    // Should create merge view
    expect(calls[2]).toContain('CREATE OR REPLACE VIEW "__utbl_ev_1"');
    expect(calls[2]).toContain('NOT IN');
    expect(calls[2]).toContain('UNION ALL');
    expect(calls[2]).toContain('"__utbl_state" != \'deleted\'');
  });

  it('init merge view selects source columns (not __utbl_state) in SELECT list', async () => {
    const engine = mockEngine();
    const ov = createEditOverlay(engine, 'trades', '2');

    await ov.init(testColumns, 'id');

    const viewSql = engine.execute.mock.calls[2][0] as string;
    // SELECT list should have source columns only
    expect(viewSql).toContain('SELECT "id", "name", "price" FROM "trades"');
    expect(viewSql).toContain('SELECT "id", "name", "price" FROM "__utbl_ov_2"');
    // __utbl_state appears only in the WHERE clause, not in SELECT
    const selectParts = viewSql.split('UNION ALL');
    for (const part of selectParts) {
      const selectClause = part.match(/SELECT (.+?) FROM/)?.[1] ?? '';
      expect(selectClause).not.toContain('__utbl_state');
    }
  });

  it('apply copies row from source then updates cell when row not in overlay', async () => {
    const engine = mockEngine();
    // First query returns count=0 (row not in overlay)
    engine.query.mockResolvedValueOnce([{ cnt: 0 }]);

    const ov = createEditOverlay(engine, 'trades', '3');
    await ov.init(testColumns, 'id');
    engine.execute.mockClear();

    await ov.apply(1, 'name', 'New Name');

    const calls = engine.execute.mock.calls.map((c: unknown[]) => c[0]);
    // Should INSERT from source
    expect(calls[0]).toContain('INSERT INTO "__utbl_ov_3"');
    expect(calls[0]).toContain('FROM "trades"');
    expect(calls[0]).toContain("\"id\" = 1");
    // Should UPDATE the cell
    expect(calls[1]).toContain('UPDATE "__utbl_ov_3"');
    expect(calls[1]).toContain('"name" = \'New Name\'');
  });

  it('apply only updates cell when row already in overlay', async () => {
    const engine = mockEngine();
    // Row already in overlay
    engine.query.mockResolvedValueOnce([{ cnt: 1 }]);

    const ov = createEditOverlay(engine, 'trades', '4');
    await ov.init(testColumns, 'id');
    engine.execute.mockClear();

    await ov.apply(1, 'price', 99.99);

    const calls = engine.execute.mock.calls.map((c: unknown[]) => c[0]);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('UPDATE "__utbl_ov_4"');
    expect(calls[0]).toContain('"price" = 99.99');
  });

  it('addRow inserts with state added', async () => {
    const engine = mockEngine();
    const ov = createEditOverlay(engine, 'trades', '5');
    await ov.init(testColumns, 'id');
    engine.execute.mockClear();

    await ov.addRow({ id: 100, name: 'Test', price: 50 });

    const sql = engine.execute.mock.calls[0][0] as string;
    expect(sql).toContain('INSERT INTO "__utbl_ov_5"');
    expect(sql).toContain("'added'");
  });

  it('deleteRow of source row inserts with state deleted', async () => {
    const engine = mockEngine();
    // Row not in overlay
    engine.query.mockResolvedValueOnce([]);

    const ov = createEditOverlay(engine, 'trades', '6');
    await ov.init(testColumns, 'id');
    engine.execute.mockClear();

    await ov.deleteRow(1);

    const sql = engine.execute.mock.calls[0][0] as string;
    expect(sql).toContain('INSERT INTO "__utbl_ov_6"');
    expect(sql).toContain("'deleted'");
  });

  it('deleteRow of added row truly removes it from overlay', async () => {
    const engine = mockEngine();
    // Row is in overlay with state 'added'
    engine.query.mockResolvedValueOnce([{ state: 'added' }]);

    const ov = createEditOverlay(engine, 'trades', '7');
    await ov.init(testColumns, 'id');
    engine.execute.mockClear();

    await ov.deleteRow(1);

    const sql = engine.execute.mock.calls[0][0] as string;
    expect(sql).toContain('DELETE FROM "__utbl_ov_7"');
  });

  it('deleteRow of edited row marks as deleted', async () => {
    const engine = mockEngine();
    // Row in overlay with state 'edited'
    engine.query.mockResolvedValueOnce([{ state: 'edited' }]);

    const ov = createEditOverlay(engine, 'trades', '8');
    await ov.init(testColumns, 'id');
    engine.execute.mockClear();

    await ov.deleteRow(1);

    const sql = engine.execute.mock.calls[0][0] as string;
    expect(sql).toContain('UPDATE "__utbl_ov_8"');
    expect(sql).toContain("\"__utbl_state\" = 'deleted'");
  });

  it('revert removes row from overlay', async () => {
    const engine = mockEngine();
    const ov = createEditOverlay(engine, 'trades', '9');
    await ov.init(testColumns, 'id');
    engine.execute.mockClear();

    await ov.revert(1);

    const sql = engine.execute.mock.calls[0][0] as string;
    expect(sql).toBe('DELETE FROM "__utbl_ov_9" WHERE "id" = 1');
  });

  it('revertAll truncates overlay', async () => {
    const engine = mockEngine();
    const ov = createEditOverlay(engine, 'trades', '10');
    await ov.init(testColumns, 'id');
    engine.execute.mockClear();

    await ov.revertAll();

    const sql = engine.execute.mock.calls[0][0] as string;
    expect(sql).toBe('DELETE FROM "__utbl_ov_10"');
  });

  it('getDirtyRows returns overlay state', async () => {
    const engine = mockEngine();
    engine.query.mockResolvedValueOnce([
      { rowId: 1, state: 'edited' },
      { rowId: 2, state: 'added' },
      { rowId: 3, state: 'deleted' },
    ]);

    const ov = createEditOverlay(engine, 'trades', '11');
    await ov.init(testColumns, 'id');

    const dirty = await ov.getDirtyRows();
    expect(dirty).toEqual([
      { rowId: 1, state: 'edited' },
      { rowId: 2, state: 'added' },
      { rowId: 3, state: 'deleted' },
    ]);
  });

  it('save applies edits, adds, deletes to source, then clears overlay', async () => {
    const engine = mockEngine();
    const ov = createEditOverlay(engine, 'trades', '12');
    await ov.init(testColumns, 'id');
    engine.execute.mockClear();

    await ov.save();

    const calls = engine.execute.mock.calls.map((c: unknown[]) => c[0] as string);
    // Should UPDATE source from overlay (edits)
    expect(calls[0]).toContain('UPDATE "trades"');
    expect(calls[0]).toContain("__utbl_state\" = 'edited'");
    // Should INSERT into source (adds)
    expect(calls[1]).toContain('INSERT INTO "trades"');
    expect(calls[1]).toContain("__utbl_state\" = 'added'");
    // Should DELETE from source (deletes)
    expect(calls[2]).toContain('DELETE FROM "trades"');
    expect(calls[2]).toContain("__utbl_state\" = 'deleted'");
    // Should clear overlay
    expect(calls[3]).toBe('DELETE FROM "__utbl_ov_12"');
  });

  it('destroy drops view and table', async () => {
    const engine = mockEngine();
    const ov = createEditOverlay(engine, 'trades', '13');
    await ov.init(testColumns, 'id');
    engine.execute.mockClear();

    await ov.destroy();

    const calls = engine.execute.mock.calls.map((c: unknown[]) => c[0]);
    expect(calls[0]).toBe('DROP VIEW IF EXISTS "__utbl_ev_13"');
    expect(calls[1]).toBe('DROP TABLE IF EXISTS "__utbl_ov_13"');
  });

  it('restoreRow inserts row with given state', async () => {
    const engine = mockEngine();
    const ov = createEditOverlay(engine, 'trades', '14');
    await ov.init(testColumns, 'id');
    engine.execute.mockClear();

    await ov.restoreRow({ id: 5, name: 'Restored', price: 10 }, 'added');

    const sql = engine.execute.mock.calls[0][0] as string;
    expect(sql).toContain('INSERT INTO "__utbl_ov_14"');
    expect(sql).toContain("'added'");
    expect(sql).toContain("'Restored'");
  });
});
