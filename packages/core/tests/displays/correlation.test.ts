import { describe, it, expect } from 'vitest';
import { correlationDisplayType } from '../../src/displays/correlation.js';

describe('correlationDisplayType', () => {
  it('has key "correlation"', () => {
    expect(correlationDisplayType.key).toBe('correlation');
  });

  it('builds SQL with CORR pairs using index-based aliases', () => {
    const columns = [
      { name: 'price', type: 'DOUBLE', mappedType: 'number' as const, nullable: true },
      { name: 'quantity', type: 'INTEGER', mappedType: 'number' as const, nullable: false },
      { name: 'revenue', type: 'DOUBLE', mappedType: 'number' as const, nullable: true },
    ];
    const sql = correlationDisplayType.buildSql('__utbl_v_0', {
      selectedColumns: ['price', 'quantity', 'revenue'],
      maxAutoColumns: 20,
      highlightThreshold: 0.7,
      showValues: true,
      colorScheme: 'diverging',
    }, columns);

    expect(sql).toContain('CORR("price", "quantity") AS "p_0_1"');
    expect(sql).toContain('CORR("price", "revenue") AS "p_0_2"');
    expect(sql).toContain('CORR("quantity", "revenue") AS "p_1_2"');
    expect(sql).toContain('FROM "__utbl_v_0"');
  });

  it('auto-selects numeric columns when selectedColumns is empty', () => {
    const columns = [
      { name: 'name', type: 'VARCHAR', mappedType: 'string' as const, nullable: true },
      { name: 'price', type: 'DOUBLE', mappedType: 'number' as const, nullable: true },
      { name: 'qty', type: 'INTEGER', mappedType: 'number' as const, nullable: false },
    ];
    const sql = correlationDisplayType.buildSql('v', {
      selectedColumns: [],
      maxAutoColumns: 20,
      highlightThreshold: 0.7,
      showValues: true,
      colorScheme: 'diverging',
    }, columns);

    expect(sql).toContain('CORR("price", "qty")');
    expect(sql).not.toContain('"name"');
  });

  it('returns SELECT 1 when fewer than 2 columns', () => {
    const sql = correlationDisplayType.buildSql('v', {
      selectedColumns: ['price'],
      maxAutoColumns: 20,
      highlightThreshold: 0.7,
      showValues: true,
      colorScheme: 'diverging',
    }, []);

    expect(sql).toBe('SELECT 1');
  });

  it('validate rejects fewer than 2 columns', () => {
    const errors = correlationDisplayType.validate!({
      selectedColumns: ['price'],
      maxAutoColumns: 20,
      highlightThreshold: 0.7,
      showValues: true,
      colorScheme: 'diverging',
    });
    expect(errors).toContain('At least 2 numeric columns are required');
  });

  it('validate rejects threshold out of range', () => {
    const errors = correlationDisplayType.validate!({
      selectedColumns: ['a', 'b'],
      maxAutoColumns: 20,
      highlightThreshold: 1.5,
      showValues: true,
      colorScheme: 'diverging',
    });
    expect(errors).toContain('Highlight threshold must be between 0 and 1');
  });

  it('validate returns null for valid config', () => {
    expect(correlationDisplayType.validate!({
      selectedColumns: ['a', 'b', 'c'],
      maxAutoColumns: 20,
      highlightThreshold: 0.7,
      showValues: true,
      colorScheme: 'diverging',
    })).toBeNull();
  });

  it('defaultConfig picks up to 20 numeric columns', () => {
    const columns = [
      { name: 'name', type: 'VARCHAR', mappedType: 'string' as const, nullable: true },
      { name: 'a', type: 'DOUBLE', mappedType: 'number' as const, nullable: true },
      { name: 'b', type: 'INTEGER', mappedType: 'number' as const, nullable: false },
    ];
    const config = correlationDisplayType.defaultConfig(columns);
    expect(config.selectedColumns).toEqual(['a', 'b']);
    expect(config.highlightThreshold).toBe(0.7);
  });
});
