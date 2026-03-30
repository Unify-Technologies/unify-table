import { describe, it, expect } from 'vitest';
import { pivotDisplayType } from '../../src/displays/pivot.js';

describe('pivotDisplayType', () => {
  it('has key "pivot"', () => {
    expect(pivotDisplayType.key).toBe('pivot');
  });

  it('builds SQL with GROUP BY and subquery limit', () => {
    const sql = pivotDisplayType.buildSql('__utbl_v_0', {
      rowField: 'region',
      colField: 'product',
      valueField: 'revenue',
      agg: 'sum',
      colLimit: 10,
      showRowTotals: true,
      showColTotals: true,
    }, []);

    expect(sql).toContain('SELECT "region" AS "row_val"');
    expect(sql).toContain('"product" AS "col_val"');
    expect(sql).toContain('SUM("revenue") AS "agg_val"');
    expect(sql).toContain('GROUP BY "region", "product"');
    expect(sql).toContain('LIMIT 10');
    expect(sql).toContain('ORDER BY "region" ASC');
  });

  it('respects rowSort desc', () => {
    const sql = pivotDisplayType.buildSql('v', {
      rowField: 'a',
      colField: 'b',
      valueField: 'c',
      agg: 'avg',
      colLimit: 50,
      showRowTotals: false,
      showColTotals: false,
      rowSort: 'desc',
    }, []);

    expect(sql).toContain('ORDER BY "a" DESC');
    expect(sql).toContain('AVG("c")');
  });

  it('validate rejects missing fields', () => {
    const errors = pivotDisplayType.validate!({
      rowField: '',
      colField: '',
      valueField: '',
      agg: 'sum',
      colLimit: 50,
      showRowTotals: true,
      showColTotals: true,
    });
    expect(errors).toContain('Row field is required');
    expect(errors).toContain('Column field is required');
    expect(errors).toContain('Value field is required');
  });

  it('validate rejects same row and column field', () => {
    const errors = pivotDisplayType.validate!({
      rowField: 'region',
      colField: 'region',
      valueField: 'revenue',
      agg: 'sum',
      colLimit: 50,
      showRowTotals: true,
      showColTotals: true,
    });
    expect(errors).toContain('Row and column fields must be different');
  });

  it('validate rejects invalid colLimit', () => {
    const errors = pivotDisplayType.validate!({
      rowField: 'a',
      colField: 'b',
      valueField: 'c',
      agg: 'sum',
      colLimit: 0,
      showRowTotals: true,
      showColTotals: true,
    });
    expect(errors).toContain('Column limit must be between 1 and 500');
  });

  it('validate returns null for valid config', () => {
    const errors = pivotDisplayType.validate!({
      rowField: 'region',
      colField: 'product',
      valueField: 'revenue',
      agg: 'sum',
      colLimit: 50,
      showRowTotals: true,
      showColTotals: true,
    });
    expect(errors).toBeNull();
  });

  it('defaultConfig picks string and numeric columns', () => {
    const columns = [
      { name: 'region', type: 'VARCHAR', mappedType: 'string' as const, nullable: false },
      { name: 'product', type: 'VARCHAR', mappedType: 'string' as const, nullable: false },
      { name: 'revenue', type: 'DOUBLE', mappedType: 'number' as const, nullable: true },
    ];
    const config = pivotDisplayType.defaultConfig(columns);
    expect(config.rowField).toBe('region');
    expect(config.colField).toBe('product');
    expect(config.valueField).toBe('revenue');
    expect(config.agg).toBe('sum');
  });
});
