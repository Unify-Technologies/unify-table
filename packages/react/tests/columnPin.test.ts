import { describe, it, expect, vi } from 'vitest';
import { columnPin } from '../src/plugins/columnPin.js';
import type { ResolvedColumn, TableContext } from '../src/types.js';

function makeCols(...defs: Array<{ field: string; width: number; pin?: 'left' | 'right' }>): ResolvedColumn[] {
  return defs.map((d) => ({
    field: d.field,
    currentWidth: d.width,
    pin: d.pin,
  })) as ResolvedColumn[];
}

function makeCtx(overrides: Partial<TableContext> = {}): TableContext {
  const ctx: any = {
    getLatest: () => ctx,
    setColumnPin: vi.fn(),
    ...overrides,
  };
  return ctx;
}

describe('columnPin plugin', () => {
  it('has correct name', () => {
    expect(columnPin().name).toBe('columnPin');
  });

  describe('transformColumns', () => {
    it('returns columns unchanged when nothing is pinned', () => {
      const cols = makeCols(
        { field: 'a', width: 100 },
        { field: 'b', width: 150 },
        { field: 'c', width: 120 },
      );
      const result = columnPin().transformColumns!(cols);
      expect(result).toBe(cols);
    });

    it('sorts left-pinned columns to the front with correct offsets', () => {
      const cols = makeCols(
        { field: 'a', width: 100 },
        { field: 'b', width: 150, pin: 'left' },
        { field: 'c', width: 120, pin: 'left' },
      );
      const result = columnPin().transformColumns!(cols);
      expect(result.map((c) => c.field)).toEqual(['b', 'c', 'a']);
      expect(result[0]._pinOffset).toBe(0);
      expect(result[0]._pinEdge).toBe(false);
      expect(result[1]._pinOffset).toBe(150);
      expect(result[1]._pinEdge).toBe(true);
      expect(result[2]._pinOffset).toBeUndefined();
    });

    it('sorts right-pinned columns to the end with correct offsets', () => {
      const cols = makeCols(
        { field: 'a', width: 100, pin: 'right' },
        { field: 'b', width: 150 },
        { field: 'c', width: 120, pin: 'right' },
      );
      const result = columnPin().transformColumns!(cols);
      expect(result.map((c) => c.field)).toEqual(['b', 'a', 'c']);
      // Right offsets are cumulative from the right edge
      expect(result[1]._pinEdge).toBe(true); // first right-pinned = edge
      expect(result[2]._pinEdge).toBe(false);
      expect(result[2]._pinOffset).toBe(0);
      expect(result[1]._pinOffset).toBe(120); // offset by c's width
    });

    it('handles both left and right pins: order is left, center, right', () => {
      const cols = makeCols(
        { field: 'center', width: 100 },
        { field: 'right1', width: 80, pin: 'right' },
        { field: 'left1', width: 60, pin: 'left' },
        { field: 'left2', width: 70, pin: 'left' },
      );
      const result = columnPin().transformColumns!(cols);
      expect(result.map((c) => c.field)).toEqual(['left1', 'left2', 'center', 'right1']);
    });

    it('computes cumulative left offsets correctly', () => {
      const cols = makeCols(
        { field: 'a', width: 50, pin: 'left' },
        { field: 'b', width: 75, pin: 'left' },
        { field: 'c', width: 100, pin: 'left' },
        { field: 'd', width: 200 },
      );
      const result = columnPin().transformColumns!(cols);
      expect(result[0]._pinOffset).toBe(0);
      expect(result[1]._pinOffset).toBe(50);
      expect(result[2]._pinOffset).toBe(125);
      // Only last left-pinned has edge
      expect(result[0]._pinEdge).toBe(false);
      expect(result[1]._pinEdge).toBe(false);
      expect(result[2]._pinEdge).toBe(true);
    });

    it('handles single left-pinned column', () => {
      const cols = makeCols(
        { field: 'a', width: 100, pin: 'left' },
        { field: 'b', width: 150 },
      );
      const result = columnPin().transformColumns!(cols);
      expect(result[0]._pinOffset).toBe(0);
      expect(result[0]._pinEdge).toBe(true);
    });
  });

  describe('headerContextMenuItems', () => {
    it('returns Pin submenu with separator', () => {
      const ctx = makeCtx();
      const col = makeCols({ field: 'a', width: 100 })[0];
      const items = columnPin().headerContextMenuItems!(ctx, col);
      expect(items[0].type).toBe('separator');
      expect(items[1].label).toBe('Pin');
      expect(items[1].children).toHaveLength(3);
    });

    it('disables "Pin Left" when already pinned left', () => {
      const ctx = makeCtx();
      const col = makeCols({ field: 'a', width: 100, pin: 'left' })[0];
      const items = columnPin().headerContextMenuItems!(ctx, col);
      const children = items[1].children!;
      expect(children[0].label).toBe('Pin Left');
      expect(children[0].disabled).toBe(true);
      expect(children[1].label).toBe('Pin Right');
      expect(children[1].disabled).toBe(false);
      expect(children[2].label).toBe('Unpin');
      expect(children[2].disabled).toBe(false);
    });

    it('disables "Pin Right" when already pinned right', () => {
      const ctx = makeCtx();
      const col = makeCols({ field: 'a', width: 100, pin: 'right' })[0];
      const items = columnPin().headerContextMenuItems!(ctx, col);
      const children = items[1].children!;
      expect(children[0].disabled).toBe(false);
      expect(children[1].disabled).toBe(true);
      expect(children[2].disabled).toBe(false);
    });

    it('disables "Unpin" when not pinned', () => {
      const ctx = makeCtx();
      const col = makeCols({ field: 'a', width: 100 })[0];
      const items = columnPin().headerContextMenuItems!(ctx, col);
      const children = items[1].children!;
      expect(children[2].disabled).toBe(true);
    });

    it('Pin Left action calls setColumnPin', () => {
      const ctx = makeCtx();
      const col = makeCols({ field: 'ticker', width: 100 })[0];
      const items = columnPin().headerContextMenuItems!(ctx, col);
      items[1].children![0].action();
      expect(ctx.setColumnPin).toHaveBeenCalledWith('ticker', 'left');
    });

    it('Unpin action calls setColumnPin with null', () => {
      const ctx = makeCtx();
      const col = makeCols({ field: 'ticker', width: 100, pin: 'left' })[0];
      const items = columnPin().headerContextMenuItems!(ctx, col);
      items[1].children![2].action();
      expect(ctx.setColumnPin).toHaveBeenCalledWith('ticker', null);
    });
  });
});
