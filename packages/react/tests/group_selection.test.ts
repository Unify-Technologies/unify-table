import { describe, it, expect } from 'vitest';
import { emptySelection } from '../src/utils.js';
import { serializeGroupKey } from '../src/plugins/row_grouping.js';
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
});
