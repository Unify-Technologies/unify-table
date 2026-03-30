import { describe, it, expect } from 'vitest';
import { select, update, insertInto, deleteFrom } from '../../src/sql/select.js';
import { eq, gt, and } from '../../src/sql/filters.js';

describe('select builder', () => {
  it('select all from table', () => {
    expect(select().from('trades').sql()).toBe('SELECT * FROM "trades"');
  });

  it('select specific fields', () => {
    expect(select('ticker', 'pnl').from('trades').sql()).toBe(
      'SELECT "ticker", "pnl" FROM "trades"'
    );
  });

  it('with where clause', () => {
    expect(select().from('trades').where(eq('region', 'EMEA')).sql()).toBe(
      `SELECT * FROM "trades" WHERE "region" = 'EMEA'`
    );
  });

  it('with multiple where clauses (AND)', () => {
    expect(
      select().from('trades').where(eq('region', 'EMEA'), gt('pnl', 0)).sql()
    ).toBe(`SELECT * FROM "trades" WHERE "region" = 'EMEA' AND "pnl" > 0`);
  });

  it('with orderBy', () => {
    expect(select().from('trades').orderBy('pnl', 'desc').sql()).toBe(
      'SELECT * FROM "trades" ORDER BY "pnl" DESC'
    );
  });

  it('with multiple orderBy', () => {
    expect(
      select().from('trades').orderBy('region', 'asc').orderBy('pnl', 'desc').sql()
    ).toBe('SELECT * FROM "trades" ORDER BY "region" ASC, "pnl" DESC');
  });

  it('with groupBy', () => {
    expect(select('region').from('trades').groupBy('region').sql()).toBe(
      'SELECT "region" FROM "trades" GROUP BY "region"'
    );
  });

  it('with limit and offset', () => {
    expect(select().from('trades').limit(50).offset(100).sql()).toBe(
      'SELECT * FROM "trades" LIMIT 50 OFFSET 100'
    );
  });

  it('full query', () => {
    const sql = select('region', 'pnl')
      .from('trades')
      .where(gt('pnl', 0))
      .groupBy('region')
      .orderBy('pnl', 'desc')
      .limit(10)
      .offset(0)
      .sql();
    expect(sql).toBe(
      'SELECT "region", "pnl" FROM "trades" WHERE "pnl" > 0 GROUP BY "region" ORDER BY "pnl" DESC LIMIT 10 OFFSET 0'
    );
  });

  it('is immutable — chaining creates new instances', () => {
    const base = select().from('trades');
    const withSort = base.orderBy('pnl', 'desc');
    const withLimit = base.limit(10);

    expect(base.sql()).toBe('SELECT * FROM "trades"');
    expect(withSort.sql()).toBe('SELECT * FROM "trades" ORDER BY "pnl" DESC');
    expect(withLimit.sql()).toBe('SELECT * FROM "trades" LIMIT 10');
  });

  it('toString returns same as sql()', () => {
    const q = select().from('trades');
    expect(q.toString()).toBe(q.sql());
  });
});

describe('update builder', () => {
  it('simple update', () => {
    expect(
      update('trades').set('pnl', 100).where(eq('id', 1)).sql()
    ).toBe(`UPDATE "trades" SET "pnl" = 100 WHERE "id" = 1`);
  });

  it('multiple sets', () => {
    expect(
      update('trades').set('pnl', 100).set('status', 'closed').where(eq('id', 1)).sql()
    ).toBe(`UPDATE "trades" SET "pnl" = 100, "status" = 'closed' WHERE "id" = 1`);
  });

  it('throws without set', () => {
    expect(() => update('trades').sql()).toThrow('UPDATE requires at least one SET clause');
  });
});

describe('insertInto builder', () => {
  it('single row', () => {
    expect(
      insertInto('trades').values({ ticker: 'AAPL', pnl: 100 }).sql()
    ).toBe(`INSERT INTO "trades" ("ticker", "pnl") VALUES ('AAPL', 100)`);
  });

  it('multiple rows', () => {
    const sql = insertInto('trades')
      .values({ ticker: 'AAPL', pnl: 100 })
      .values({ ticker: 'GOOG', pnl: 200 })
      .sql();
    expect(sql).toBe(
      `INSERT INTO "trades" ("ticker", "pnl") VALUES ('AAPL', 100), ('GOOG', 200)`
    );
  });

  it('handles null values', () => {
    expect(
      insertInto('trades').values({ ticker: 'AAPL', notes: null }).sql()
    ).toBe(`INSERT INTO "trades" ("ticker", "notes") VALUES ('AAPL', NULL)`);
  });

  it('throws without values', () => {
    expect(() => insertInto('trades').sql()).toThrow('INSERT requires at least one row');
  });
});

describe('deleteFrom builder', () => {
  it('delete with where', () => {
    expect(
      deleteFrom('trades').where(eq('id', 1)).sql()
    ).toBe(`DELETE FROM "trades" WHERE "id" = 1`);
  });

  it('delete all (no where)', () => {
    expect(deleteFrom('trades').sql()).toBe('DELETE FROM "trades"');
  });

  it('multiple where clauses', () => {
    expect(
      deleteFrom('trades').where(eq('region', 'EMEA'), gt('pnl', 1000)).sql()
    ).toBe(`DELETE FROM "trades" WHERE "region" = 'EMEA' AND "pnl" > 1000`);
  });
});
