import { describe, it, expect } from 'vitest';
import { outliersDisplayType } from '../../src/displays/outliers.js';

describe('outliersDisplayType', () => {
  it('has key "outliers"', () => {
    expect(outliersDisplayType.key).toBe('outliers');
  });

  it('builds IQR method SQL with CTE', () => {
    const sql = outliersDisplayType.buildSql('__utbl_v_0', {
      field: 'price',
      method: 'iqr',
      threshold: 1.5,
      labelField: 'name',
      limit: 50,
    }, []);

    expect(sql).toContain('WITH stats AS');
    expect(sql).toContain('AVG("price") AS mu');
    expect(sql).toContain('STDDEV_SAMP("price") AS sigma');
    expect(sql).toContain('PERCENTILE_CONT(0.25)');
    expect(sql).toContain('PERCENTILE_CONT(0.50)');
    expect(sql).toContain('PERCENTILE_CONT(0.75)');
    expect(sql).toContain('bounds AS');
    expect(sql).toContain('q1 - 1.5 * (q3 - q1) AS lower_bound');
    expect(sql).toContain('WHERE t."price" < b.lower_bound OR t."price" > b.upper_bound');
    expect(sql).toContain('UNION ALL');
    expect(sql).toContain('LIMIT 51'); // 50 + 1 for sentinel
    expect(sql).toContain('t."name" AS "label"');
  });

  it('builds z-score method SQL', () => {
    const sql = outliersDisplayType.buildSql('v', {
      field: 'score',
      method: 'zscore',
      threshold: 3.0,
      limit: 100,
    }, []);

    expect(sql).toContain('WHERE ABS((t."score" - b.mu) / NULLIF(b.sigma, 0)) > 3');
    expect(sql).toContain('LIMIT 101');
  });

  it('omits label columns when no labelField', () => {
    const sql = outliersDisplayType.buildSql('v', {
      field: 'price',
      method: 'iqr',
      threshold: 1.5,
    }, []);

    expect(sql).not.toContain('AS "label"');
  });

  it('validate rejects missing field', () => {
    const errors = outliersDisplayType.validate!({
      field: '',
      method: 'iqr',
      threshold: 1.5,
    });
    expect(errors).toContain('Numeric field is required');
  });

  it('validate rejects negative threshold', () => {
    const errors = outliersDisplayType.validate!({
      field: 'price',
      method: 'iqr',
      threshold: -1,
    });
    expect(errors).toContain('Threshold must be positive');
  });

  it('validate returns null for valid config', () => {
    expect(outliersDisplayType.validate!({
      field: 'price',
      method: 'iqr',
      threshold: 1.5,
    })).toBeNull();
  });

  it('defaultConfig picks numeric and string columns', () => {
    const columns = [
      { name: 'name', type: 'VARCHAR', mappedType: 'string' as const, nullable: true },
      { name: 'price', type: 'DOUBLE', mappedType: 'number' as const, nullable: true },
    ];
    const config = outliersDisplayType.defaultConfig(columns);
    expect(config.field).toBe('price');
    expect(config.labelField).toBe('name');
    expect(config.method).toBe('iqr');
    expect(config.threshold).toBe(1.5);
  });
});
