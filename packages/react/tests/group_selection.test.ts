import { describe, it, expect } from 'vitest';
import { emptySelection } from '../src/utils.js';
import { serializeGroupKey } from '../src/plugins/row_grouping.js';
import { deriveGroupState } from '../src/plugins/selection.js';
import type { SelectionState } from '../src/types.js';

describe('SelectionState group fields', () => {
  it('emptySelection includes group fields', () => {
    const sel = emptySelection();
    expect(sel.selectedGroups).toBeInstanceOf(Set);
    expect(sel.selectedGroups.size).toBe(0);
    expect(sel.groupCount).toBe(0);
  });

  it('group selection and data selection are structurally mutually exclusive', () => {
    // A group-selected state has no data selection
    const groupSel: SelectionState = {
      span: null,
      additionalSpans: [],
      selectedIds: new Set(),
      selectedCells: [],
      count: 0,
      asFilter: () => null,
      selectedGroups: new Set([serializeGroupKey({ region: 'US' })]),
      groupCount: 1,
    };

    expect(groupSel.selectedGroups.size).toBe(1);
    expect(groupSel.count).toBe(0);
    expect(groupSel.selectedIds.size).toBe(0);
    expect(groupSel.selectedCells.length).toBe(0);
    expect(groupSel.span).toBeNull();
  });

  it('data selection has no group selection', () => {
    const dataSel: SelectionState = {
      span: { anchor: { row: 0, col: 0 }, focus: { row: 2, col: 3 } },
      additionalSpans: [],
      selectedIds: new Set(['1', '2', '3']),
      selectedCells: [],
      count: 3,
      asFilter: () => null,
      selectedGroups: new Set(),
      groupCount: 0,
    };

    expect(dataSel.selectedGroups.size).toBe(0);
    expect(dataSel.groupCount).toBe(0);
    expect(dataSel.count).toBe(3);
  });

  it('multi-group selection tracks multiple serialized keys', () => {
    const keys = new Set([
      serializeGroupKey({ region: 'US' }),
      serializeGroupKey({ region: 'EMEA' }),
      serializeGroupKey({ region: 'APAC' }),
    ]);
    const sel = deriveGroupState(keys);

    expect(sel.groupCount).toBe(3);
    expect(sel.selectedGroups.size).toBe(3);
    expect(sel.selectedGroups.has(serializeGroupKey({ region: 'US' }))).toBe(true);
    expect(sel.selectedGroups.has(serializeGroupKey({ region: 'EMEA' }))).toBe(true);
    expect(sel.selectedGroups.has(serializeGroupKey({ region: 'APAC' }))).toBe(true);
    // Data selection must be empty
    expect(sel.count).toBe(0);
    expect(sel.selectedIds.size).toBe(0);
    expect(sel.selectedCells).toHaveLength(0);
    expect(sel.span).toBeNull();
  });

  it('nested group key serialization includes all depth fields', () => {
    const nestedKey = { region: 'US', desk: 'NY', ticker: 'AAPL' };
    const serialized = serializeGroupKey(nestedKey);
    const entries: [string, unknown][] = JSON.parse(serialized);

    // Should have all three fields, sorted alphabetically
    expect(entries).toHaveLength(3);
    expect(entries[0][0]).toBe('desk');
    expect(entries[1][0]).toBe('region');
    expect(entries[2][0]).toBe('ticker');
  });
});

describe('serializeGroupKey for selection', () => {
  it('produces stable keys for Set membership', () => {
    const key1 = { region: 'US', sector: 'Tech' };
    const key2 = { sector: 'Tech', region: 'US' };

    const set = new Set<string>();
    set.add(serializeGroupKey(key1));

    // Same group key in different field order should match
    expect(set.has(serializeGroupKey(key2))).toBe(true);
  });

  it('different groups produce different keys', () => {
    const key1 = { region: 'US' };
    const key2 = { region: 'EMEA' };

    expect(serializeGroupKey(key1)).not.toBe(serializeGroupKey(key2));
  });

  it('serialized keys are parseable back to entries', () => {
    const key = { region: 'LATAM', desk: 'Trading' };
    const serialized = serializeGroupKey(key);
    const entries: [string, unknown][] = JSON.parse(serialized);

    expect(entries).toEqual([['desk', 'Trading'], ['region', 'LATAM']]);
  });
});
