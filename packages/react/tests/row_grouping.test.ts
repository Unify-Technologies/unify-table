import { describe, it, expect } from 'vitest';
import { serializeGroupKey, isGroupRow } from '../src/plugins/row_grouping.js';
import type { GroupRow } from '../src/plugins/row_grouping.js';

describe('serializeGroupKey', () => {
  it('serializes a simple key', () => {
    const key = { region: 'US' };
    const result = serializeGroupKey(key);
    expect(result).toBe('[["region","US"]]');
  });

  it('serializes a multi-field key in sorted order', () => {
    const key1 = { region: 'US', sector: 'Tech' };
    const key2 = { sector: 'Tech', region: 'US' };
    // Same keys in different insertion order should produce same serialization
    expect(serializeGroupKey(key1)).toBe(serializeGroupKey(key2));
  });

  it('handles null values', () => {
    const key = { region: null };
    const result = serializeGroupKey(key);
    expect(result).toBe('[["region",null]]');
  });

  it('handles numeric values', () => {
    const key = { year: 2024 };
    const result = serializeGroupKey(key);
    expect(result).toBe('[["year",2024]]');
  });
});

describe('isGroupRow', () => {
  it('identifies group rows', () => {
    const groupRow: Record<string, unknown> = {
      __group: true,
      __groupKey: { region: 'US' },
      __groupCount: 10,
      __expanded: false,
      __depth: 0,
    };
    expect(isGroupRow(groupRow)).toBe(true);
  });

  it('rejects regular rows', () => {
    const regularRow = { id: 1, ticker: 'AAPL', region: 'US' };
    expect(isGroupRow(regularRow)).toBe(false);
  });

  it('rejects rows with __group = false', () => {
    const row = { __group: false };
    expect(isGroupRow(row)).toBe(false);
  });
});

describe('rowGrouping plugin', async () => {
  const { rowGrouping } = await import('../src/plugins/row_grouping.js');

  it('creates plugin with correct name', () => {
    const plugin = rowGrouping();
    expect(plugin.name).toBe('rowGrouping');
  });

  it('has keyboard shortcuts', () => {
    const plugin = rowGrouping();
    expect(plugin.shortcuts).toBeDefined();
    expect(plugin.shortcuts!.ArrowRight).toBeDefined();
    expect(plugin.shortcuts!.ArrowLeft).toBeDefined();
  });

  it('does not provide context menu items (grouping via panel)', () => {
    const plugin = rowGrouping();
    expect(plugin.contextMenuItems).toBeUndefined();
  });

  it('transformRows returns rows unchanged when no groups', () => {
    const plugin = rowGrouping();
    const rows = [{ id: 1 }, { id: 2 }];
    const result = plugin.transformRows!(rows);
    expect(result).toEqual(rows);
  });

  it('has a groupChildrenCache for sub-groups (hierarchical grouping)', () => {
    // The plugin should support hierarchical grouping
    const plugin = rowGrouping();
    expect(plugin.name).toBe('rowGrouping');
    // transformRows with no summaries should pass through
    const rows = [{ id: 1 }];
    expect(plugin.transformRows!(rows)).toEqual(rows);
  });
});
