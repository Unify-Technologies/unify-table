import { describe, it, expect } from 'vitest';
import { summaryDisplayType } from '../../src/displays/summary.js';

describe('summaryDisplayType', () => {
  it('has key "summary"', () => {
    expect(summaryDisplayType.key).toBe('summary');
  });

  it('builds SUMMARIZE SQL for all columns', () => {
    const columns = [
      { name: 'id', type: 'INTEGER', mappedType: 'number' as const, nullable: false },
      { name: 'name', type: 'VARCHAR', mappedType: 'string' as const, nullable: true },
    ];
    const sql = summaryDisplayType.buildSql('__utbl_v_0', {
      excludeColumns: [],
      showDistributions: true,
      histogramBins: 20,
      layout: 'grid',
    }, columns);

    expect(sql).toBe('SUMMARIZE SELECT "id", "name" FROM "__utbl_v_0"');
  });

  it('excludes columns from SUMMARIZE', () => {
    const columns = [
      { name: 'id', type: 'INTEGER', mappedType: 'number' as const, nullable: false },
      { name: 'name', type: 'VARCHAR', mappedType: 'string' as const, nullable: true },
      { name: 'pnl', type: 'DOUBLE', mappedType: 'number' as const, nullable: true },
    ];
    const sql = summaryDisplayType.buildSql('v', {
      excludeColumns: ['name'],
      showDistributions: true,
      histogramBins: 20,
      layout: 'grid',
    }, columns);

    expect(sql).toContain('"id"');
    expect(sql).toContain('"pnl"');
    expect(sql).not.toContain('"name"');
  });

  it('falls back to SELECT * when all columns excluded', () => {
    const columns = [
      { name: 'id', type: 'INTEGER', mappedType: 'number' as const, nullable: false },
    ];
    const sql = summaryDisplayType.buildSql('v', {
      excludeColumns: ['id'],
      showDistributions: true,
      histogramBins: 20,
      layout: 'grid',
    }, columns);

    expect(sql).toContain('SUMMARIZE SELECT * FROM "v"');
  });

  it('validate rejects out-of-range bins', () => {
    expect(summaryDisplayType.validate!({
      excludeColumns: [],
      showDistributions: true,
      histogramBins: 1,
      layout: 'grid',
    })).toContain('Histogram bins must be between 2 and 100');

    expect(summaryDisplayType.validate!({
      excludeColumns: [],
      showDistributions: true,
      histogramBins: 101,
      layout: 'grid',
    })).toContain('Histogram bins must be between 2 and 100');
  });

  it('validate returns null for valid config', () => {
    expect(summaryDisplayType.validate!({
      excludeColumns: [],
      showDistributions: true,
      histogramBins: 20,
      layout: 'grid',
    })).toBeNull();
  });

  it('defaultConfig returns sensible defaults', () => {
    const config = summaryDisplayType.defaultConfig([]);
    expect(config.excludeColumns).toEqual([]);
    expect(config.showDistributions).toBe(true);
    expect(config.histogramBins).toBe(20);
    expect(config.layout).toBe('grid');
    expect(config.cardSize).toBe('md');
  });
});
