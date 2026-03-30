import { describe, it, expect } from 'vitest';
import { eq, neq, gt, gte, lt, lte, contains, startsWith, endsWith, oneOf, between, isNull, isNotNull, and, or, not, raw, parseFilterExpr } from '../../src/sql/filters.js';

describe('SQL filters', () => {
  describe('comparison', () => {
    it('eq with string', () => {
      expect(eq('region', 'EMEA').sql).toBe(`"region" = 'EMEA'`);
    });

    it('eq with number', () => {
      expect(eq('pnl', 100).sql).toBe(`"pnl" = 100`);
    });

    it('eq with null', () => {
      expect(eq('notes', null).sql).toBe(`"notes" IS NULL`);
    });

    it('neq with value', () => {
      expect(neq('status', 'closed').sql).toBe(`"status" != 'closed'`);
    });

    it('neq with null', () => {
      expect(neq('notes', null).sql).toBe(`"notes" IS NOT NULL`);
    });

    it('gt', () => {
      expect(gt('pnl', 0).sql).toBe(`"pnl" > 0`);
    });

    it('gte', () => {
      expect(gte('pnl', 0).sql).toBe(`"pnl" >= 0`);
    });

    it('lt', () => {
      expect(lt('pnl', 100).sql).toBe(`"pnl" < 100`);
    });

    it('lte', () => {
      expect(lte('pnl', 100).sql).toBe(`"pnl" <= 100`);
    });
  });

  describe('text', () => {
    it('contains', () => {
      expect(contains('name', 'apple').sql).toBe(`"name" ILIKE '%apple%' ESCAPE '\\'`);
    });

    it('contains escapes wildcards', () => {
      expect(contains('name', '100%').sql).toBe(`"name" ILIKE '%100\\%%' ESCAPE '\\'`);
    });

    it('contains escapes single quotes', () => {
      expect(contains('name', "O'Brien").sql).toBe(`"name" ILIKE '%O''Brien%' ESCAPE '\\'`);
    });

    it('startsWith', () => {
      expect(startsWith('ticker', 'AA').sql).toBe(`"ticker" ILIKE 'AA%' ESCAPE '\\'`);
    });

    it('endsWith', () => {
      expect(endsWith('email', '.com').sql).toBe(`"email" ILIKE '%.com' ESCAPE '\\'`);
    });
  });

  describe('set / range', () => {
    it('oneOf with values', () => {
      expect(oneOf('status', ['active', 'pending']).sql).toBe(
        `"status" IN ('active', 'pending')`
      );
    });

    it('oneOf with empty array returns FALSE', () => {
      expect(oneOf('status', []).sql).toBe('FALSE');
    });

    it('between', () => {
      expect(between('date', '2024-01-01', '2024-12-31').sql).toBe(
        `"date" BETWEEN '2024-01-01' AND '2024-12-31'`
      );
    });
  });

  describe('null checks', () => {
    it('isNull', () => {
      expect(isNull('notes').sql).toBe(`"notes" IS NULL`);
    });

    it('isNotNull', () => {
      expect(isNotNull('notes').sql).toBe(`"notes" IS NOT NULL`);
    });
  });

  describe('combinators', () => {
    it('and', () => {
      expect(and(eq('x', 1), gt('y', 2)).sql).toBe(`("x" = 1 AND "y" > 2)`);
    });

    it('and with single clause', () => {
      expect(and(eq('x', 1)).sql).toBe(`"x" = 1`);
    });

    it('and with no clauses', () => {
      expect(and().sql).toBe('TRUE');
    });

    it('or', () => {
      expect(or(eq('x', 1), eq('x', 2)).sql).toBe(`("x" = 1 OR "x" = 2)`);
    });

    it('or with no clauses', () => {
      expect(or().sql).toBe('FALSE');
    });

    it('not', () => {
      expect(not(eq('x', 1)).sql).toBe(`NOT ("x" = 1)`);
    });

    it('nested combinators', () => {
      const filter = and(
        or(eq('region', 'EMEA'), eq('region', 'US')),
        gt('pnl', 0)
      );
      expect(filter.sql).toBe(`(("region" = 'EMEA' OR "region" = 'US') AND "pnl" > 0)`);
    });
  });

  describe('raw', () => {
    it('passes through SQL', () => {
      expect(raw("custom_func(x) = 1").sql).toBe("custom_func(x) = 1");
    });
  });

  describe('parseFilterExpr', () => {
    it('returns null for empty input', () => {
      expect(parseFilterExpr('pnl', '')).toBeNull();
      expect(parseFilterExpr('pnl', '   ')).toBeNull();
    });

    it('>= comparison', () => {
      expect(parseFilterExpr('pnl', '>= 10').sql).toBe('"pnl" >= 10');
    });

    it('<= comparison', () => {
      expect(parseFilterExpr('pnl', '<= 10').sql).toBe('"pnl" <= 10');
    });

    it('> comparison', () => {
      expect(parseFilterExpr('pnl', '> 0').sql).toBe('"pnl" > 0');
    });

    it('< comparison', () => {
      expect(parseFilterExpr('pnl', '< 100').sql).toBe('"pnl" < 100');
    });

    it('!= comparison', () => {
      expect(parseFilterExpr('status', '!= closed').sql).toBe(`"status" != 'closed'`);
    });

    it('= exact match', () => {
      expect(parseFilterExpr('region', '= EMEA').sql).toBe(`"region" = 'EMEA'`);
    });

    it('= exact match with number', () => {
      expect(parseFilterExpr('pnl', '= 42').sql).toBe(`"pnl" = 42`);
    });

    it('range with ..', () => {
      expect(parseFilterExpr('pnl', '10..100').sql).toBe('"pnl" BETWEEN 10 AND 100');
    });

    it('range with string values', () => {
      expect(parseFilterExpr('date', '2024-01-01..2024-12-31').sql).toBe(
        `"date" BETWEEN '2024-01-01' AND '2024-12-31'`
      );
    });

    it('comma-separated values', () => {
      expect(parseFilterExpr('region', 'EMEA,US,APAC').sql).toBe(
        `"region" IN ('EMEA', 'US', 'APAC')`
      );
    });

    it('comma-separated numbers', () => {
      expect(parseFilterExpr('id', '1,2,3').sql).toBe('"id" IN (1, 2, 3)');
    });

    it('startsWith with trailing %', () => {
      expect(parseFilterExpr('ticker', 'USD%').sql).toBe(`"ticker" ILIKE 'USD%' ESCAPE '\\'`);
    });

    it('endsWith with leading %', () => {
      expect(parseFilterExpr('email', '%.com').sql).toBe(`"email" ILIKE '%.com' ESCAPE '\\'`);
    });

    it('contains with surrounding %', () => {
      expect(parseFilterExpr('name', '%apple%').sql).toBe(`"name" ILIKE '%apple%' ESCAPE '\\'`);
    });

    it('NULL', () => {
      expect(parseFilterExpr('notes', 'NULL').sql).toBe('"notes" IS NULL');
    });

    it('!NULL', () => {
      expect(parseFilterExpr('notes', '!NULL').sql).toBe('"notes" IS NOT NULL');
    });

    it('null case-insensitive', () => {
      expect(parseFilterExpr('notes', 'null').sql).toBe('"notes" IS NULL');
    });

    it('plain text defaults to contains', () => {
      expect(parseFilterExpr('name', 'apple').sql).toBe(`"name" ILIKE '%apple%' ESCAPE '\\'`);
    });
  });

  describe('parseFilterExpr — date columns', () => {
    it('relative: today', () => {
      const result = parseFilterExpr('d', 'today', 'date')!;
      // Should be an eq with today's ISO date
      expect(result.sql).toMatch(/^"d" = '\d{4}-\d{2}-\d{2}'$/);
    });

    it('relative: yesterday', () => {
      const result = parseFilterExpr('d', 'yesterday', 'date')!;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const expected = yesterday.toISOString().slice(0, 10);
      expect(result.sql).toBe(`"d" = '${expected}'`);
    });

    it('relative: today-7', () => {
      const result = parseFilterExpr('d', 'today-7', 'date')!;
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const expected = d.toISOString().slice(0, 10);
      expect(result.sql).toBe(`"d" = '${expected}'`);
    });

    it('relative: today+30', () => {
      const result = parseFilterExpr('d', 'today+30', 'date')!;
      expect(result.sql).toMatch(/^"d" = '\d{4}-\d{2}-\d{2}'$/);
    });

    it('comparison with relative date', () => {
      const result = parseFilterExpr('d', '>= today-7', 'date')!;
      expect(result.sql).toMatch(/^"d" >= '\d{4}-\d{2}-\d{2}'$/);
    });

    it('comparison with ISO date', () => {
      expect(parseFilterExpr('d', '>= 2024-01-01', 'date')!.sql).toBe(`"d" >= '2024-01-01'`);
    });

    it('whole month: 2024-03', () => {
      expect(parseFilterExpr('d', '2024-03', 'date')!.sql).toBe(
        `"d" BETWEEN '2024-03-01' AND '2024-03-31'`
      );
    });

    it('whole month: February leap year 2024', () => {
      expect(parseFilterExpr('d', '2024-02', 'date')!.sql).toBe(
        `"d" BETWEEN '2024-02-01' AND '2024-02-29'`
      );
    });

    it('whole year: 2024', () => {
      expect(parseFilterExpr('d', '2024', 'date')!.sql).toBe(
        `"d" BETWEEN '2024-01-01' AND '2024-12-31'`
      );
    });

    it('date range with ..', () => {
      expect(parseFilterExpr('d', '2024-01-01..2024-06-30', 'date')!.sql).toBe(
        `"d" BETWEEN '2024-01-01' AND '2024-06-30'`
      );
    });

    it('range with relative dates', () => {
      const result = parseFilterExpr('d', 'today-30..today', 'date')!;
      expect(result.sql).toMatch(/^"d" BETWEEN '\d{4}-\d{2}-\d{2}' AND '\d{4}-\d{2}-\d{2}'$/);
    });

    it('exact ISO date as bare input', () => {
      expect(parseFilterExpr('d', '2024-06-15', 'date')!.sql).toBe(`"d" = '2024-06-15'`);
    });

    it('year without date hint is treated as number', () => {
      // Without column type hint, 2024 is a number
      expect(parseFilterExpr('id', '2024')!.sql).toBe(`"id" ILIKE '%2024%' ESCAPE '\\'`);
    });
  });

  describe('SQL injection prevention', () => {
    it('escapes single quotes in eq', () => {
      expect(eq('name', "'; DROP TABLE trades; --").sql).toBe(
        `"name" = '''; DROP TABLE trades; --'`
      );
    });

    it('escapes double quotes in column names', () => {
      expect(eq('col"name', 'test').sql).toBe(`"col""name" = 'test'`);
    });

    it('escapes wildcards in contains', () => {
      expect(contains('name', '_%').sql).toBe(`"name" ILIKE '%\\_\\%%' ESCAPE '\\'`);
    });
  });
});
