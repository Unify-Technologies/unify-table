import { describe, it, expect } from 'vitest';
import { timelineDisplayType } from '../../src/displays/timeline.js';

describe('timelineDisplayType', () => {
  it('has key "timeline"', () => {
    expect(timelineDisplayType.key).toBe('timeline');
  });

  it('builds SQL with date_trunc and COUNT when no valueField', () => {
    const sql = timelineDisplayType.buildSql('__utbl_v_0', {
      dateField: 'created_at',
      bucket: 'day',
      agg: 'count',
    }, []);

    expect(sql).toContain("date_trunc('day', \"created_at\") AS \"bucket\"");
    expect(sql).toContain('COUNT("created_at") AS "value"');
    expect(sql).toContain('GROUP BY "bucket"');
    expect(sql).toContain('ORDER BY "bucket" ASC');
  });

  it('builds SQL with aggregation when valueField is set', () => {
    const sql = timelineDisplayType.buildSql('v', {
      dateField: 'ts',
      bucket: 'month',
      valueField: 'amount',
      agg: 'sum',
    }, []);

    expect(sql).toContain("date_trunc('month', \"ts\")");
    expect(sql).toContain('SUM("amount") AS "value"');
  });

  it('includes series in GROUP BY', () => {
    const sql = timelineDisplayType.buildSql('v', {
      dateField: 'ts',
      bucket: 'hour',
      agg: 'count',
      series: 'category',
    }, []);

    expect(sql).toContain('"category"');
    expect(sql).toContain('GROUP BY "bucket", "category"');
  });

  it('respects limit', () => {
    const sql = timelineDisplayType.buildSql('v', {
      dateField: 'ts',
      bucket: 'day',
      agg: 'count',
      limit: 100,
    }, []);

    expect(sql).toContain('LIMIT 100');
  });

  it('validate rejects missing dateField', () => {
    const errors = timelineDisplayType.validate!({
      dateField: '',
      bucket: 'day',
      agg: 'count',
    });
    expect(errors).toContain('Date/timestamp field is required');
  });

  it('validate returns null for valid config', () => {
    expect(timelineDisplayType.validate!({
      dateField: 'ts',
      bucket: 'day',
      agg: 'count',
    })).toBeNull();
  });

  it('defaultConfig picks timestamp column', () => {
    const columns = [
      { name: 'id', type: 'INTEGER', mappedType: 'number' as const, nullable: false },
      { name: 'created_at', type: 'TIMESTAMP', mappedType: 'timestamp' as const, nullable: true },
      { name: 'amount', type: 'DOUBLE', mappedType: 'number' as const, nullable: true },
    ];
    const config = timelineDisplayType.defaultConfig(columns);
    expect(config.dateField).toBe('created_at');
    expect(config.valueField).toBe('amount'); // id is excluded as identity column
    expect(config.bucket).toBe('day');
    expect(config.agg).toBe('sum');
  });
});
