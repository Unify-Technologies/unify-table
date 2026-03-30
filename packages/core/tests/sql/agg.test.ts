import { describe, it, expect } from 'vitest';
import { sum, avg, count, min, max, countDistinct, first, last, any, mode, stddev, variance, stringAgg, registerAgg, aggToSql } from '../../src/sql/agg.js';

describe('aggregations', () => {
  it('sum', () => {
    expect(sum('pnl')).toBe('SUM("pnl")');
  });

  it('avg', () => {
    expect(avg('pnl')).toBe('AVG("pnl")');
  });

  it('count', () => {
    expect(count('id')).toBe('COUNT("id")');
  });

  it('min', () => {
    expect(min('price')).toBe('MIN("price")');
  });

  it('max', () => {
    expect(max('price')).toBe('MAX("price")');
  });

  it('count_distinct', () => {
    expect(countDistinct('region')).toBe('COUNT(DISTINCT "region")');
  });

  it('median', () => {
    expect(aggToSql('median', 'pnl')).toBe('MEDIAN("pnl")');
  });

  it('first', () => {
    expect(first('ticker')).toBe('FIRST("ticker")');
  });

  it('last', () => {
    expect(last('ticker')).toBe('LAST("ticker")');
  });

  it('any', () => {
    expect(any('region')).toBe('ANY_VALUE("region")');
  });

  it('mode', () => {
    expect(mode('status')).toBe('MODE("status")');
  });

  it('stddev', () => {
    expect(stddev('pnl')).toBe('STDDEV_SAMP("pnl")');
  });

  it('variance', () => {
    expect(variance('pnl')).toBe('VARIANCE("pnl")');
  });

  it('string_agg', () => {
    expect(stringAgg('name')).toBe(`STRING_AGG("name", ', ')`);
  });

  it('unknown agg throws', () => {
    expect(() => aggToSql('foobar', 'x')).toThrow('Unknown aggregation: foobar');
  });

  it('custom registered agg', () => {
    registerAgg('wavg', (field) => `SUM(${field} * "weight") / SUM("weight")`);
    expect(aggToSql('wavg', 'pnl')).toBe('SUM("pnl" * "weight") / SUM("weight")');
  });

  it('escapes column names with quotes', () => {
    expect(sum('col"name')).toBe('SUM("col""name")');
  });
});
