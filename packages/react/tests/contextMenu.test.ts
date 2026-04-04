import { describe, it, expect, vi } from 'vitest';
import { contextMenu } from '../src/plugins/contextMenu.js';
import { emptySelection } from '../src/utils.js';
import type { TableContext, ResolvedColumn, SelectionState } from '../src/types.js';

function makeCols(...fields: string[]): ResolvedColumn[] {
  return fields.map((f) => ({ field: f, currentWidth: 100, sortable: true })) as ResolvedColumn[];
}

function makeCtx(overrides: Record<string, any> = {}): TableContext {
  const ctx: any = {
    rows: [],
    columns: makeCols('id', 'name', 'price'),
    selection: emptySelection(),
    sort: [],
    filters: [],
    groupBy: [],
    totalCount: 100,
    table: 'trades',
    engine: { exportBlob: vi.fn(), columns: vi.fn() },
    setSelection: vi.fn(),
    setSort: vi.fn(),
    setGroupBy: vi.fn(),
    on: vi.fn().mockReturnValue(vi.fn()),
    emit: vi.fn(),
    getLatest: () => ctx,
    getPlugin: () => undefined,
    containerRef: { current: null },
    ...overrides,
  };
  return ctx;
}

describe('contextMenu plugin', () => {
  it('has correct name', () => {
    expect(contextMenu().name).toBe('contextMenu');
  });

  describe('contextMenuItems (default items)', () => {
    it('returns Copy, Select all, separator, and 3 export items', () => {
      const ctx = makeCtx();
      const items = contextMenu().contextMenuItems!(ctx, {} as any);
      const labels = items.filter((i) => i.type !== 'separator').map((i) => i.label);
      expect(labels).toContain('Copy');
      expect(labels).toContain('Select all');
      expect(labels).toContain('Export as CSV');
      expect(labels).toContain('Export as JSON');
      expect(labels).toContain('Export as Parquet');
    });

    it('disables Copy when no selection', () => {
      const ctx = makeCtx();
      const items = contextMenu().contextMenuItems!(ctx, {} as any);
      const copy = items.find((i) => i.label === 'Copy')!;
      expect(copy.disabled).toBe(true);
    });

    it('enables Copy when selection exists', () => {
      const sel: SelectionState = {
        ...emptySelection(),
        selectedIds: new Set(['1']),
        count: 1,
        selectedCells: [{ rowIndex: 0, colIndex: 0, rowId: '1', field: 'id', value: 1 }],
      };
      const ctx = makeCtx({ selection: sel });
      const items = contextMenu().contextMenuItems!(ctx, {} as any);
      const copy = items.find((i) => i.label === 'Copy')!;
      expect(copy.disabled).toBe(false);
    });

    it('shows "All rows" child with formatted count on export items', () => {
      const ctx = makeCtx({ totalCount: 1234 });
      const items = contextMenu().contextMenuItems!(ctx, {} as any);
      const csv = items.find((i) => i.label === 'Export as CSV')!;
      expect(csv.children).toBeDefined();
      expect(csv.children![0].label).toContain('All rows');
      expect(csv.children![0].label).toContain('1,234');
    });

    it('shows "Selection" child when selection has items', () => {
      const sel: SelectionState = {
        ...emptySelection(),
        span: { anchor: { row: 0, col: 0 }, focus: { row: 2, col: 1 } },
        selectedIds: new Set(['1', '2', '3']),
        count: 3,
        selectedCells: [],
      };
      const ctx = makeCtx({ selection: sel });
      const items = contextMenu().contextMenuItems!(ctx, {} as any);
      const csv = items.find((i) => i.label === 'Export as CSV')!;
      const selChild = csv.children!.find((c) => c.label.startsWith('Selection'));
      expect(selChild).toBeDefined();
    });

    it('shows "Filtered" child when filters exist', () => {
      const ctx = makeCtx({ filters: [{ field: 'name', op: 'eq', value: 'x' }] });
      const items = contextMenu().contextMenuItems!(ctx, {} as any);
      const csv = items.find((i) => i.label === 'Export as CSV')!;
      const filteredChild = csv.children!.find((c) => c.label.startsWith('Filtered'));
      expect(filteredChild).toBeDefined();
    });

    it('does not show "Selection" or "Filtered" when not applicable', () => {
      const ctx = makeCtx();
      const items = contextMenu().contextMenuItems!(ctx, {} as any);
      const csv = items.find((i) => i.label === 'Export as CSV')!;
      expect(csv.children).toHaveLength(1); // Only "All rows"
    });
  });

  describe('contextMenuItems with extraItems', () => {
    it('appends extra items after a separator', () => {
      const extra = (_ctx: TableContext) => [{ label: 'Custom Action', action: () => {} }];
      const ctx = makeCtx();
      const items = contextMenu(extra).contextMenuItems!(ctx, {} as any);
      const lastNonSep = items.filter((i) => i.type !== 'separator');
      expect(lastNonSep[lastNonSep.length - 1].label).toBe('Custom Action');
      // Separator before extra items
      const sepCount = items.filter((i) => i.type === 'separator').length;
      expect(sepCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('headerContextMenuItems', () => {
    it('returns Sort submenu for sortable column', () => {
      const ctx = makeCtx();
      const col = makeCols('price')[0];
      const items = contextMenu().headerContextMenuItems!(ctx, col);
      const sort = items.find((i) => i.label === 'Sort');
      expect(sort).toBeDefined();
      expect(sort!.children).toHaveLength(3);
      expect(sort!.children![0].label).toBe('Ascending');
      expect(sort!.children![1].label).toBe('Descending');
      expect(sort!.children![2].label).toBe('Clear');
    });

    it('disables "Ascending" when already sorted asc', () => {
      const ctx = makeCtx({ sort: [{ field: 'price', dir: 'asc' }] });
      const col = makeCols('price')[0];
      const items = contextMenu().headerContextMenuItems!(ctx, col);
      const sort = items.find((i) => i.label === 'Sort')!;
      expect(sort.children![0].disabled).toBe(true);
      expect(sort.children![1].disabled).toBe(false);
    });

    it('disables "Descending" when already sorted desc', () => {
      const ctx = makeCtx({ sort: [{ field: 'price', dir: 'desc' }] });
      const col = makeCols('price')[0];
      const items = contextMenu().headerContextMenuItems!(ctx, col);
      const sort = items.find((i) => i.label === 'Sort')!;
      expect(sort.children![0].disabled).toBe(false);
      expect(sort.children![1].disabled).toBe(true);
    });

    it('disables "Clear" when column is not sorted', () => {
      const ctx = makeCtx();
      const col = makeCols('price')[0];
      const items = contextMenu().headerContextMenuItems!(ctx, col);
      const sort = items.find((i) => i.label === 'Sort')!;
      expect(sort.children![2].disabled).toBe(true);
    });

    it('omits Sort submenu for non-sortable column', () => {
      const ctx = makeCtx();
      const col = { field: 'notes', currentWidth: 100, sortable: false } as ResolvedColumn;
      const items = contextMenu().headerContextMenuItems!(ctx, col);
      const sort = items.find((i) => i.label === 'Sort');
      expect(sort).toBeUndefined();
    });

    it('shows "Group by this Column" when not grouped', () => {
      const ctx = makeCtx({ groupBy: [] });
      const col = makeCols('name')[0];
      const items = contextMenu().headerContextMenuItems!(ctx, col);
      const group = items.find((i) => i.label === 'Group by this Column');
      expect(group).toBeDefined();
    });

    it('shows "Remove Grouping" when already grouped', () => {
      const ctx = makeCtx({ groupBy: ['name'] });
      const col = makeCols('name')[0];
      const items = contextMenu().headerContextMenuItems!(ctx, col);
      const group = items.find((i) => i.label === 'Remove Grouping');
      expect(group).toBeDefined();
    });

    it('Sort Ascending action calls setSort', () => {
      const ctx = makeCtx();
      const col = makeCols('price')[0];
      const items = contextMenu().headerContextMenuItems!(ctx, col);
      const sort = items.find((i) => i.label === 'Sort')!;
      sort.children![0].action();
      expect(ctx.setSort).toHaveBeenCalledWith([{ field: 'price', dir: 'asc' }]);
    });

    it('Group action calls setGroupBy', () => {
      const ctx = makeCtx({ groupBy: [] });
      const col = makeCols('name')[0];
      const items = contextMenu().headerContextMenuItems!(ctx, col);
      const group = items.find((i) => i.label === 'Group by this Column')!;
      group.action();
      expect(ctx.setGroupBy).toHaveBeenCalledWith(['name']);
    });

    it('includes Copy Column Name item', () => {
      const ctx = makeCtx();
      const col = makeCols('ticker')[0];
      const items = contextMenu().headerContextMenuItems!(ctx, col);
      const copyName = items.find((i) => i.label === 'Copy Column Name');
      expect(copyName).toBeDefined();
    });
  });
});
