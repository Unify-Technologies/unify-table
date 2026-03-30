import { describe, it, expect } from 'vitest';
import { statsDisplayType } from '../../src/displays/stats.js';

describe('statsDisplayType', () => {
  it('has key "stats"', () => {
    expect(statsDisplayType.key).toBe('stats');
  });

  it('builds SQL with aggregations', () => {
    const sql = statsDisplayType.buildSql('__utbl_v_0', {
      fields: [
        { field: 'pnl', aggs: ['sum', 'avg', 'min', 'max'] },
        { field: 'volume', aggs: ['count', 'median'] },
      ],
    }, []);

    expect(sql).toContain('SUM("pnl") AS "pnl__sum"');
    expect(sql).toContain('AVG("pnl") AS "pnl__avg"');
    expect(sql).toContain('MIN("pnl") AS "pnl__min"');
    expect(sql).toContain('MAX("pnl") AS "pnl__max"');
    expect(sql).toContain('COUNT("volume") AS "volume__count"');
    expect(sql).toContain('MEDIAN("volume") AS "volume__median"');
    expect(sql).toContain('FROM "__utbl_v_0"');
  });

  it('produces valid SQL when no fields', () => {
    const sql = statsDisplayType.buildSql('v', { fields: [] }, []);
    expect(sql).toContain('SELECT 1 FROM "v"');
  });

  it('validate rejects empty fields', () => {
    const errors = statsDisplayType.validate!({ fields: [] });
    expect(errors).toContain('At least one field is required');
  });

  it('validate rejects fields with no aggs', () => {
    const errors = statsDisplayType.validate!({
      fields: [{ field: 'pnl', aggs: [] }],
    });
    expect(errors).toContain('At least one aggregation is required for pnl');
  });

  it('validate returns null for valid config', () => {
    const errors = statsDisplayType.validate!({
      fields: [{ field: 'pnl', aggs: ['sum'] }],
    });
    expect(errors).toBeNull();
  });

  it('defaultConfig picks numeric columns', () => {
    const columns = [
      { name: 'id', type: 'INTEGER', mappedType: 'number' as const, nullable: false },
      { name: 'name', type: 'VARCHAR', mappedType: 'string' as const, nullable: true },
      { name: 'pnl', type: 'DOUBLE', mappedType: 'number' as const, nullable: true },
    ];
    const config = statsDisplayType.defaultConfig(columns);
    expect(config.fields.length).toBe(1); // id is excluded as identity column
    expect(config.fields[0].field).toBe('pnl');
  });

  it('defaultConfig sets cardSize to md', () => {
    const config = statsDisplayType.defaultConfig([]);
    expect(config.cardSize).toBe('md');
  });
});
