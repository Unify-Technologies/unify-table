import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseTSV, detectHeaderRow, copyGroupData } from '../src/plugins/clipboard.js';
import { serializeGroupKey } from '../src/plugins/row_grouping.js';
import { emptySelection } from '../src/utils.js';
import type { TableContext, ResolvedColumn, SelectionState } from '../src/types.js';

function makeCols(...fields: string[]): ResolvedColumn[] {
  return fields.map((f) => ({ field: f, currentWidth: 100 })) as ResolvedColumn[];
}

function makeGroupCtx(overrides: Record<string, any> = {}): TableContext {
  const ctx: any = {
    rows: [],
    columns: makeCols('id', 'region', 'desk', 'pnl'),
    selection: emptySelection(),
    activeCell: null,
    groupBy: ['region'],
    table: 'trades',
    totalCount: 100,
    sort: [],
    filters: [],
    engine: { exportBlob: vi.fn(), execute: vi.fn(), query: vi.fn(), columns: vi.fn() },
    datasource: {
      fetchGroupDetail: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
    },
    setActiveCell: vi.fn(),
    setSelection: vi.fn(),
    on: vi.fn().mockReturnValue(vi.fn()),
    emit: vi.fn(),
    getLatest: () => ctx,
    getPlugin: () => undefined,
    containerRef: { current: null },
    refresh: vi.fn(),
    ...overrides,
  };
  return ctx;
}

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

describe('copyGroupData', () => {
  let clipboardText: string;

  beforeEach(() => {
    clipboardText = '';
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn((text: string) => {
          clipboardText = text;
          return Promise.resolve();
        }),
        readText: vi.fn().mockResolvedValue(''),
      },
    });
  });

  it('does nothing when no groups selected', async () => {
    const ctx = makeGroupCtx();
    await copyGroupData(ctx);
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it('copies data rows from expanded leaf group', async () => {
    const groupKey = { region: 'US' };
    const serialized = serializeGroupKey(groupKey);
    const rows: Record<string, unknown>[] = [
      { __group: true, __groupKey: groupKey, __groupCount: 2, __expanded: true, __depth: 0, __aggs: {}, region: 'US' },
      { id: 1, region: 'US', desk: 'NY', pnl: 100 },
      { id: 2, region: 'US', desk: 'LA', pnl: 200 },
      { __group: true, __groupKey: { region: 'EMEA' }, __groupCount: 1, __expanded: false, __depth: 0, __aggs: {}, region: 'EMEA' },
    ];

    const sel: SelectionState = {
      ...emptySelection(),
      selectedGroups: new Set([serialized]),
      groupCount: 1,
    };

    const ctx = makeGroupCtx({ rows, selection: sel, groupBy: ['region'] });
    await copyGroupData(ctx);

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    const text = clipboardText;
    const lines = text.split('\n');
    // Header + 2 data rows
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('id\tregion\tdesk\tpnl');
    expect(lines[1]).toContain('US');
    expect(lines[2]).toContain('US');
  });

  it('fetches data via datasource for collapsed group', async () => {
    const groupKey = { region: 'EMEA' };
    const serialized = serializeGroupKey(groupKey);
    const rows: Record<string, unknown>[] = [
      { __group: true, __groupKey: groupKey, __groupCount: 3, __expanded: false, __depth: 0, __aggs: {}, region: 'EMEA' },
    ];

    const fetchedRows = [
      { id: 10, region: 'EMEA', desk: 'London', pnl: 50 },
      { id: 11, region: 'EMEA', desk: 'Paris', pnl: 75 },
    ];

    const sel: SelectionState = {
      ...emptySelection(),
      selectedGroups: new Set([serialized]),
      groupCount: 1,
    };

    const ctx = makeGroupCtx({
      rows,
      selection: sel,
      groupBy: ['region'],
      datasource: {
        fetchGroupDetail: vi.fn().mockResolvedValue({ rows: fetchedRows, total: 2 }),
      },
    });

    await copyGroupData(ctx);

    expect(ctx.datasource.fetchGroupDetail).toHaveBeenCalledWith(groupKey, { offset: 0, limit: 10000 });
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    const lines = clipboardText.split('\n');
    expect(lines).toHaveLength(3); // header + 2 rows
  });

  it('skips placeholder rows in expanded group', async () => {
    const groupKey = { region: 'US' };
    const serialized = serializeGroupKey(groupKey);
    const rows: Record<string, unknown>[] = [
      { __group: true, __groupKey: groupKey, __groupCount: 2, __expanded: true, __depth: 0, __aggs: {}, region: 'US' },
      { id: 1, region: 'US', desk: 'NY', pnl: 100 },
      { __placeholder: true },
      { id: 3, region: 'US', desk: 'LA', pnl: 300 },
    ];

    const sel: SelectionState = {
      ...emptySelection(),
      selectedGroups: new Set([serialized]),
      groupCount: 1,
    };

    const ctx = makeGroupCtx({ rows, selection: sel, groupBy: ['region'] });
    await copyGroupData(ctx);

    const lines = clipboardText.split('\n');
    expect(lines).toHaveLength(3); // header + 2 data rows (placeholder skipped)
  });

  it('stops collecting at next same-depth group', async () => {
    const groupKey = { region: 'US' };
    const serialized = serializeGroupKey(groupKey);
    const rows: Record<string, unknown>[] = [
      { __group: true, __groupKey: groupKey, __groupCount: 1, __expanded: true, __depth: 0, __aggs: {}, region: 'US' },
      { id: 1, region: 'US', desk: 'NY', pnl: 100 },
      { __group: true, __groupKey: { region: 'EMEA' }, __groupCount: 1, __expanded: true, __depth: 0, __aggs: {}, region: 'EMEA' },
      { id: 2, region: 'EMEA', desk: 'London', pnl: 200 },
    ];

    const sel: SelectionState = {
      ...emptySelection(),
      selectedGroups: new Set([serialized]),
      groupCount: 1,
    };

    const ctx = makeGroupCtx({ rows, selection: sel, groupBy: ['region'] });
    await copyGroupData(ctx);

    const lines = clipboardText.split('\n');
    // Header + 1 data row (only US, not EMEA)
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('US');
  });

  it('copies from multiple selected groups', async () => {
    const keyUS = { region: 'US' };
    const keyEMEA = { region: 'EMEA' };
    const rows: Record<string, unknown>[] = [
      { __group: true, __groupKey: keyUS, __groupCount: 1, __expanded: true, __depth: 0, __aggs: {}, region: 'US' },
      { id: 1, region: 'US', desk: 'NY', pnl: 100 },
      { __group: true, __groupKey: keyEMEA, __groupCount: 1, __expanded: true, __depth: 0, __aggs: {}, region: 'EMEA' },
      { id: 2, region: 'EMEA', desk: 'London', pnl: 200 },
    ];

    const sel: SelectionState = {
      ...emptySelection(),
      selectedGroups: new Set([serializeGroupKey(keyUS), serializeGroupKey(keyEMEA)]),
      groupCount: 2,
    };

    const ctx = makeGroupCtx({ rows, selection: sel, groupBy: ['region'] });
    await copyGroupData(ctx);

    const lines = clipboardText.split('\n');
    // Header + 2 data rows (one from each group)
    expect(lines).toHaveLength(3);
  });

  it('fetches via datasource for non-leaf nested group', async () => {
    const groupKey = { region: 'US' };
    const serialized = serializeGroupKey(groupKey);
    // depth 0 in a 2-level groupBy (region, desk) — not leaf
    const rows: Record<string, unknown>[] = [
      { __group: true, __groupKey: groupKey, __groupCount: 10, __expanded: true, __depth: 0, __aggs: {}, region: 'US' },
      { __group: true, __groupKey: { region: 'US', desk: 'NY' }, __groupCount: 5, __expanded: false, __depth: 1, __aggs: {}, region: 'US', desk: 'NY' },
    ];

    const fetchedRows = [
      { id: 1, region: 'US', desk: 'NY', pnl: 100 },
    ];

    const sel: SelectionState = {
      ...emptySelection(),
      selectedGroups: new Set([serialized]),
      groupCount: 1,
    };

    const ctx = makeGroupCtx({
      rows,
      selection: sel,
      groupBy: ['region', 'desk'],
      datasource: {
        fetchGroupDetail: vi.fn().mockResolvedValue({ rows: fetchedRows, total: 1 }),
      },
    });

    await copyGroupData(ctx);

    // Non-leaf group (depth 0 < maxDepth 1) → fetches via datasource
    expect(ctx.datasource.fetchGroupDetail).toHaveBeenCalledWith(groupKey, { offset: 0, limit: 10000 });
  });
});
