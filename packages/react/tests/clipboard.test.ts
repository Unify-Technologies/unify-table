import { describe, it, expect } from 'vitest';
import { parseTSV, detectHeaderRow } from '../src/plugins/clipboard.js';

describe('parseTSV', () => {
  it('parses tab-separated rows', () => {
    const result = parseTSV('a\tb\tc\n1\t2\t3\n4\t5\t6');
    expect(result).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
      ['4', '5', '6'],
    ]);
  });

  it('filters empty lines', () => {
    const result = parseTSV('a\tb\n1\t2\n\n3\t4\n');
    expect(result).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('handles single column', () => {
    const result = parseTSV('name\nAlice\nBob');
    expect(result).toEqual([['name'], ['Alice'], ['Bob']]);
  });

  it('returns empty array for empty input', () => {
    expect(parseTSV('')).toEqual([]);
    expect(parseTSV('  ')).toEqual([]);
  });
});

describe('detectHeaderRow', () => {
  const columns = [
    { field: 'ticker' },
    { field: 'pnl' },
    { field: 'region' },
  ];

  it('detects header when first row matches column fields', () => {
    const parsed = [
      ['ticker', 'pnl', 'region'],
      ['AAPL', '100', 'US'],
    ];
    expect(detectHeaderRow(parsed, columns)).toBe(true);
  });

  it('detects header with partial match (>= 50%)', () => {
    const parsed = [
      ['ticker', 'pnl', 'unknown_col'],
      ['AAPL', '100', 'US'],
    ];
    expect(detectHeaderRow(parsed, columns)).toBe(true);
  });

  it('returns false when first row does not match fields', () => {
    const parsed = [
      ['AAPL', '100', 'US'],
      ['GOOG', '-50', 'EMEA'],
    ];
    expect(detectHeaderRow(parsed, columns)).toBe(false);
  });

  it('returns false for single-row data', () => {
    const parsed = [['ticker', 'pnl', 'region']];
    expect(detectHeaderRow(parsed, columns)).toBe(false);
  });

  it('returns false for empty data', () => {
    expect(detectHeaderRow([], columns)).toBe(false);
  });
});
