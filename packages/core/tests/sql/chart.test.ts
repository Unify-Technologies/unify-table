import { describe, it, expect } from 'vitest';
import { barLineSql, pieSql, scatterSql, histogramSql, heatmapSql, buildChartSql } from '../../src/sql/chart.js';

describe('barLineSql', () => {
  it('generates basic GROUP BY with one y field', () => {
    const sql = barLineSql({
      table: 'sales',
      x: 'region',
      y: [{ field: 'revenue', agg: 'sum' }],
    });
    expect(sql).toContain('SELECT "region"');
    expect(sql).toContain('SUM("revenue") AS "sum_revenue"');
    expect(sql).toContain('FROM "sales"');
    expect(sql).toContain('GROUP BY "region"');
    expect(sql).toContain('ORDER BY "region" ASC');
  });

  it('includes series in GROUP BY', () => {
    const sql = barLineSql({
      table: 'sales',
      x: 'month',
      y: [{ field: 'revenue', agg: 'sum' }],
      series: 'product',
    });
    expect(sql).toContain('GROUP BY "month", "product"');
  });

  it('applies sort=value', () => {
    const sql = barLineSql({
      table: 'sales',
      x: 'region',
      y: [{ field: 'revenue', agg: 'sum' }],
      sort: 'value',
    });
    expect(sql).toContain('ORDER BY "sum_revenue" DESC');
  });

  it('applies limit', () => {
    const sql = barLineSql({
      table: 'sales',
      x: 'region',
      y: [{ field: 'revenue', agg: 'sum' }],
      limit: 10,
    });
    expect(sql).toContain('LIMIT 10');
  });
});

describe('pieSql', () => {
  it('groups by label with ORDER BY value DESC', () => {
    const sql = pieSql({
      table: 'sales',
      label: 'category',
      value: { field: 'amount', agg: 'sum' },
    });
    expect(sql).toContain('GROUP BY "category"');
    expect(sql).toContain('ORDER BY "sum_amount" DESC');
  });
});

describe('scatterSql', () => {
  it('generates raw SELECT', () => {
    const sql = scatterSql({ table: 'points', x: 'px', y: 'py' });
    expect(sql).toContain('SELECT "px", "py"');
    expect(sql).not.toContain('GROUP BY');
  });
});

describe('histogramSql', () => {
  it('uses width_bucket', () => {
    const sql = histogramSql({ table: 'data', field: 'value' });
    expect(sql).toContain('width_bucket');
    expect(sql).toContain('GROUP BY bin');
  });
});

describe('heatmapSql', () => {
  it('groups by x and y', () => {
    const sql = heatmapSql({
      table: 'matrix',
      x: 'row',
      y: 'col',
      value: { field: 'score', agg: 'avg' },
    });
    expect(sql).toContain('GROUP BY "row", "col"');
  });
});

describe('buildChartSql', () => {
  it('dispatches bar type to barLineSql', () => {
    const sql = buildChartSql('__utbl_v_0', {
      type: 'bar',
      x: 'ticker',
      y: { field: 'pnl', agg: 'sum' },
    });
    expect(sql).toContain('FROM "__utbl_v_0"');
    expect(sql).toContain('SUM("pnl")');
    expect(sql).toContain('GROUP BY "ticker"');
  });

  it('dispatches pie type to pieSql', () => {
    const sql = buildChartSql('__utbl_v_1', {
      type: 'pie',
      x: 'region',
      y: { field: 'pnl', agg: 'sum' },
    });
    expect(sql).toContain('FROM "__utbl_v_1"');
    expect(sql).toContain('GROUP BY "region"');
  });

  it('dispatches scatter type', () => {
    const sql = buildChartSql('__utbl_v_0', {
      type: 'scatter',
      x: 'volume',
      y: { field: 'pnl', agg: 'sum' },
    });
    expect(sql).toContain('SELECT "volume", "pnl"');
    expect(sql).not.toContain('GROUP BY');
  });

  it('dispatches histogram type', () => {
    const sql = buildChartSql('view', {
      type: 'histogram',
      x: 'pnl',
      y: { field: 'pnl', agg: 'count' },
      limit: 30,
    });
    expect(sql).toContain('width_bucket');
    expect(sql).toContain('30');
  });

  it('queries FROM the view, not the underlying table', () => {
    const sql = buildChartSql('__utbl_v_42', {
      type: 'bar',
      x: 'ticker',
      y: [{ field: 'pnl', agg: 'sum' }],
    });
    expect(sql).toContain('FROM "__utbl_v_42"');
    expect(sql).not.toContain('FROM "trades"');
  });
});
