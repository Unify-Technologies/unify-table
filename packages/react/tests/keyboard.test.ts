import { describe, it, expect, vi, beforeEach } from 'vitest';
import { keyboard } from '../src/plugins/keyboard.js';
import { emptySelection } from '../src/utils.js';
import type { TableContext, ResolvedColumn } from '../src/types.js';
import type { Row } from '@unify/table-core';

function makeCols(...fields: string[]): ResolvedColumn[] {
  return fields.map((f) => ({ field: f, currentWidth: 100 })) as ResolvedColumn[];
}

function makeRows(...data: Record<string, unknown>[]): Row[] {
  return data as Row[];
}

function makeCtx(rows: Row[], columns: ResolvedColumn[], overrides: Record<string, any> = {}): TableContext {
  const container = document.createElement('div');
  const ctx: any = {
    rows,
    columns,
    selection: emptySelection(),
    activeCell: null,
    editing: null,
    formulas: null,
    setActiveCell: vi.fn(),
    setSelection: vi.fn(),
    containerRef: { current: container },
    on: vi.fn().mockReturnValue(vi.fn()),
    emit: vi.fn(),
    getLatest: () => ctx,
    getPlugin: () => undefined,
    _allPlugins: () => [plugin],
    ...overrides,
  };
  return ctx;
}

// Reference to the plugin for _allPlugins
let plugin = keyboard();

describe('keyboard plugin', () => {
  beforeEach(() => {
    plugin = keyboard();
  });

  it('has correct name', () => {
    expect(plugin.name).toBe('keyboard');
  });

  it('defines arrow key, Tab, Enter, Escape, F2 shortcuts', () => {
    expect(plugin.shortcuts).toBeDefined();
    expect(plugin.shortcuts!.ArrowUp).toBeDefined();
    expect(plugin.shortcuts!.ArrowDown).toBeDefined();
    expect(plugin.shortcuts!.ArrowLeft).toBeDefined();
    expect(plugin.shortcuts!.ArrowRight).toBeDefined();
    expect(plugin.shortcuts!.Tab).toBeDefined();
    expect(plugin.shortcuts!.Enter).toBeDefined();
    expect(plugin.shortcuts!.Escape).toBeDefined();
    expect(plugin.shortcuts!.F2).toBeDefined();
  });

  describe('moveActiveCell via shortcuts', () => {
    it('sets cell to (0,0) when no active cell and arrow key pressed', () => {
      const rows = makeRows({ id: 1 }, { id: 2 });
      const cols = makeCols('id', 'name');
      const ctx = makeCtx(rows, cols);

      plugin.shortcuts!.ArrowDown(ctx);

      expect(ctx.setActiveCell).toHaveBeenCalledWith(
        expect.objectContaining({ rowIndex: 0, colIndex: 0 }),
      );
    });

    it('moves right', () => {
      const rows = makeRows({ id: 1, name: 'Alice' });
      const cols = makeCols('id', 'name');
      const ctx = makeCtx(rows, cols, {
        activeCell: { rowIndex: 0, colIndex: 0, rowId: '1', field: 'id', value: 1 },
      });

      plugin.shortcuts!.ArrowRight(ctx);

      expect(ctx.setActiveCell).toHaveBeenCalledWith(
        expect.objectContaining({ rowIndex: 0, colIndex: 1, field: 'name' }),
      );
    });

    it('moves down', () => {
      const rows = makeRows({ id: 1 }, { id: 2 });
      const cols = makeCols('id');
      const ctx = makeCtx(rows, cols, {
        activeCell: { rowIndex: 0, colIndex: 0, rowId: '1', field: 'id', value: 1 },
      });

      plugin.shortcuts!.ArrowDown(ctx);

      expect(ctx.setActiveCell).toHaveBeenCalledWith(
        expect.objectContaining({ rowIndex: 1, colIndex: 0 }),
      );
    });

    it('clamps at top boundary', () => {
      const rows = makeRows({ id: 1 });
      const cols = makeCols('id');
      const ctx = makeCtx(rows, cols, {
        activeCell: { rowIndex: 0, colIndex: 0, rowId: '1', field: 'id', value: 1 },
      });

      plugin.shortcuts!.ArrowUp(ctx);

      // Still at row 0 — clamped
      expect(ctx.setActiveCell).toHaveBeenCalledWith(
        expect.objectContaining({ rowIndex: 0, colIndex: 0 }),
      );
    });

    it('clamps at left boundary', () => {
      const rows = makeRows({ id: 1 });
      const cols = makeCols('id');
      const ctx = makeCtx(rows, cols, {
        activeCell: { rowIndex: 0, colIndex: 0, rowId: '1', field: 'id', value: 1 },
      });

      plugin.shortcuts!.ArrowLeft(ctx);

      // Still at col 0 — clamped
      expect(ctx.setActiveCell).toHaveBeenCalledWith(
        expect.objectContaining({ rowIndex: 0, colIndex: 0 }),
      );
    });

    it('Tab moves right (same as ArrowRight)', () => {
      const rows = makeRows({ id: 1, name: 'Alice' });
      const cols = makeCols('id', 'name');
      const ctx = makeCtx(rows, cols, {
        activeCell: { rowIndex: 0, colIndex: 0, rowId: '1', field: 'id', value: 1 },
      });

      plugin.shortcuts!.Tab(ctx);

      expect(ctx.setActiveCell).toHaveBeenCalledWith(
        expect.objectContaining({ colIndex: 1 }),
      );
    });

    it('does nothing with empty rows', () => {
      const ctx = makeCtx([], makeCols('id'));
      plugin.shortcuts!.ArrowDown(ctx);
      expect(ctx.setActiveCell).not.toHaveBeenCalled();
    });
  });

  describe('Enter shortcut', () => {
    it('starts editing when activeCell and editing plugin exist', () => {
      const startEditing = vi.fn();
      const activeCell = { rowIndex: 0, colIndex: 0, rowId: '1', field: 'id', value: 1 };
      const ctx = makeCtx(makeRows({ id: 1 }), makeCols('id'), {
        activeCell,
        editing: { startEditing, editingCell: null },
      });

      plugin.shortcuts!.Enter(ctx);

      expect(startEditing).toHaveBeenCalledWith(activeCell);
    });

    it('does nothing when no activeCell', () => {
      const startEditing = vi.fn();
      const ctx = makeCtx(makeRows({ id: 1 }), makeCols('id'), {
        editing: { startEditing },
      });

      plugin.shortcuts!.Enter(ctx);

      expect(startEditing).not.toHaveBeenCalled();
    });
  });

  describe('Escape shortcut', () => {
    it('cancels editing when editing a cell', () => {
      const cancelEdit = vi.fn();
      const ctx = makeCtx(makeRows({ id: 1 }), makeCols('id'), {
        editing: { editingCell: { rowIndex: 0 }, cancelEdit },
      });

      plugin.shortcuts!.Escape(ctx);

      expect(cancelEdit).toHaveBeenCalled();
    });

    it('clears active cell when not editing', () => {
      const ctx = makeCtx(makeRows({ id: 1 }), makeCols('id'), {
        activeCell: { rowIndex: 0, colIndex: 0 },
        editing: null,
      });

      plugin.shortcuts!.Escape(ctx);

      expect(ctx.setActiveCell).toHaveBeenCalledWith(null);
    });
  });

  describe('F2 shortcut', () => {
    it('starts editing when active cell exists and not already editing', () => {
      const startEditing = vi.fn();
      const activeCell = { rowIndex: 0, colIndex: 0, rowId: '1', field: 'id', value: 1 };
      const ctx = makeCtx(makeRows({ id: 1 }), makeCols('id'), {
        activeCell,
        editing: { startEditing, editingCell: null },
      });

      plugin.shortcuts!.F2(ctx);

      expect(startEditing).toHaveBeenCalledWith(activeCell);
    });

    it('does not start editing when already editing', () => {
      const startEditing = vi.fn();
      const ctx = makeCtx(makeRows({ id: 1 }), makeCols('id'), {
        activeCell: { rowIndex: 0, colIndex: 0 },
        editing: { startEditing, editingCell: { rowIndex: 0 } },
      });

      plugin.shortcuts!.F2(ctx);

      expect(startEditing).not.toHaveBeenCalled();
    });
  });

  describe('init', () => {
    it('returns cleanup function', () => {
      const ctx = makeCtx(makeRows({ id: 1 }), makeCols('id'));
      const cleanup = plugin.init!(ctx);
      expect(typeof cleanup).toBe('function');
      cleanup!();
    });

    it('returns undefined when no container', () => {
      const ctx = makeCtx(makeRows({ id: 1 }), makeCols('id'), {
        containerRef: { current: null },
      });
      const result = plugin.init!(ctx);
      expect(result).toBeUndefined();
    });

    it('handles Ctrl+Z for undo', () => {
      const undo = vi.fn();
      const ctx = makeCtx(makeRows({ id: 1 }), makeCols('id'), {
        editing: { canUndo: true, undo, editingCell: null },
      });

      const cleanup = plugin.init!(ctx);
      const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
      ctx.containerRef.current.dispatchEvent(event);

      expect(undo).toHaveBeenCalled();
      cleanup!();
    });

    it('falls back to formulas undo when editing cannot undo', () => {
      const formulasUndo = vi.fn();
      const ctx = makeCtx(makeRows({ id: 1 }), makeCols('id'), {
        editing: { canUndo: false, editingCell: null },
        formulas: { canUndo: true, undo: formulasUndo },
      });

      const cleanup = plugin.init!(ctx);
      const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
      ctx.containerRef.current.dispatchEvent(event);

      expect(formulasUndo).toHaveBeenCalled();
      cleanup!();
    });

    it('handles Ctrl+Y for redo', () => {
      const redo = vi.fn();
      const ctx = makeCtx(makeRows({ id: 1 }), makeCols('id'), {
        editing: { canRedo: true, redo, editingCell: null, canUndo: false },
      });

      const cleanup = plugin.init!(ctx);
      const event = new KeyboardEvent('keydown', { key: 'y', ctrlKey: true });
      ctx.containerRef.current.dispatchEvent(event);

      expect(redo).toHaveBeenCalled();
      cleanup!();
    });

    it('skips arrow keys when selection plugin is present', () => {
      const ctx = makeCtx(makeRows({ id: 1 }), makeCols('id'), {
        activeCell: { rowIndex: 0, colIndex: 0, rowId: '1', field: 'id', value: 1 },
        getPlugin: (name: string) => name === 'selection' ? {} : undefined,
      });

      const cleanup = plugin.init!(ctx);
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      ctx.containerRef.current.dispatchEvent(event);

      // Should not move active cell because selection plugin handles it
      expect(ctx.setActiveCell).not.toHaveBeenCalled();
      cleanup!();
    });

    it('passes through keys when editing a cell (except Escape)', () => {
      const cancelEdit = vi.fn();
      const ctx = makeCtx(makeRows({ id: 1, name: 'x' }), makeCols('id', 'name'), {
        activeCell: { rowIndex: 0, colIndex: 0 },
        editing: { editingCell: { rowIndex: 0 }, cancelEdit, canUndo: false, canRedo: false },
      });

      const cleanup = plugin.init!(ctx);

      // Regular key during editing — should pass through
      const letterEvent = new KeyboardEvent('keydown', { key: 'a' });
      ctx.containerRef.current.dispatchEvent(letterEvent);
      expect(ctx.setActiveCell).not.toHaveBeenCalled();

      // Escape during editing — should cancel
      const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      ctx.containerRef.current.dispatchEvent(escEvent);
      expect(cancelEdit).toHaveBeenCalled();

      cleanup!();
    });
  });
});
