import { describe, it, expect, vi, beforeEach } from 'vitest';
import { editing } from '../src/plugins/editing.js';
import { emptySelection } from '../src/utils.js';
import type { TableContext, EditingState } from '../src/types.js';

// Mock createEditOverlay from @unify/table-core
const mockOverlay = {
  viewName: 'v_edit_test',
  init: vi.fn().mockResolvedValue(undefined),
  apply: vi.fn().mockResolvedValue(undefined),
  addRow: vi.fn().mockResolvedValue(undefined),
  deleteRow: vi.fn().mockResolvedValue(undefined),
  revert: vi.fn().mockResolvedValue(undefined),
  revertAll: vi.fn().mockResolvedValue(undefined),
  restoreRow: vi.fn().mockResolvedValue(undefined),
  save: vi.fn().mockResolvedValue(undefined),
  destroy: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@unify/table-core', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@unify/table-core')>();
  return {
    ...orig,
    createEditOverlay: vi.fn(() => ({ ...mockOverlay })),
  };
});

function makeCtx(overrides: Record<string, any> = {}): TableContext {
  let editingState: EditingState | null = null;
  const ctx: any = {
    table: 'trades',
    rows: [
      { id: 1, name: 'Alice', price: 100 },
      { id: 2, name: 'Bob', price: 200 },
    ],
    columns: [
      { field: 'id', currentWidth: 80 },
      { field: 'name', currentWidth: 120 },
      { field: 'price', currentWidth: 100 },
    ],
    selection: emptySelection(),
    activeCell: null,
    sort: [],
    filters: [],
    datasource: { filters: [], sort: [] },
    engine: {
      columns: vi.fn().mockResolvedValue([
        { name: 'id', type: 'INTEGER' },
        { name: 'name', type: 'VARCHAR' },
        { name: 'price', type: 'DOUBLE' },
      ]),
      execute: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([]),
    },
    viewManager: {
      setBaseTable: vi.fn(),
      sync: vi.fn().mockResolvedValue(undefined),
    },
    containerRef: { current: document.createElement('div') },
    refresh: vi.fn().mockResolvedValue(undefined),
    on: vi.fn().mockReturnValue(vi.fn()),
    emit: vi.fn(),
    get editing() { return editingState; },
    _setEditing: vi.fn((state: EditingState | null) => { editingState = state; }),
    getLatest: () => ctx,
    getPlugin: () => undefined,
    ...overrides,
  };
  return ctx;
}

describe('editing plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has correct name', () => {
    expect(editing().name).toBe('editing');
  });

  it('publishes initial EditingState on init', () => {
    const ctx = makeCtx();
    const plugin = editing();
    plugin.init!(ctx);

    expect(ctx._setEditing).toHaveBeenCalled();
    const state = (ctx._setEditing as any).mock.calls[0][0] as EditingState;
    expect(state.editingCell).toBeNull();
    expect(state.canUndo).toBe(false);
    expect(state.canRedo).toBe(false);
    expect(typeof state.startEditing).toBe('function');
    expect(typeof state.commitEdit).toBe('function');
    expect(typeof state.cancelEdit).toBe('function');
    expect(typeof state.undo).toBe('function');
    expect(typeof state.redo).toBe('function');
  });

  it('subscribes to editing events', () => {
    const ctx = makeCtx();
    editing().init!(ctx);

    const events = (ctx.on as any).mock.calls.map((c: any[]) => c[0]);
    expect(events).toContain('editing:toggle');
    expect(events).toContain('editing:save');
    expect(events).toContain('editing:discard');
    expect(events).toContain('editing:batchStart');
    expect(events).toContain('editing:batchEnd');
  });

  it('returns cleanup function that nulls editing state', async () => {
    const ctx = makeCtx();
    const plugin = editing();
    const cleanup = plugin.init!(ctx);

    expect(typeof cleanup).toBe('function');
    cleanup!();

    expect(ctx._setEditing).toHaveBeenCalledWith(null);
  });

  it('cleanup restores base table when overlay was initialized', async () => {
    const ctx = makeCtx();
    const plugin = editing();
    const cleanup = plugin.init!(ctx);

    // Trigger overlay init by committing an edit
    const cell = { rowIndex: 0, colIndex: 1, rowId: '1', field: 'name', value: 'Alice' };
    await ctx.editing!.commitEdit(cell, 'Alicia');

    cleanup!();
    expect(ctx.viewManager.setBaseTable).toHaveBeenCalledWith('trades');
  });

  describe('startEditing', () => {
    it('sets editingCell and emits edit:start', () => {
      const ctx = makeCtx();
      editing().init!(ctx);

      const state = ctx.editing!;
      const cell = { rowIndex: 0, colIndex: 1, rowId: '1', field: 'name', value: 'Alice' };
      state.startEditing(cell);

      expect(ctx.emit).toHaveBeenCalledWith('edit:start', cell);
    });
  });

  describe('cancelEdit', () => {
    it('emits edit:cancel', () => {
      const ctx = makeCtx();
      editing().init!(ctx);

      const state = ctx.editing!;
      state.cancelEdit();

      expect(ctx.emit).toHaveBeenCalledWith('edit:cancel');
    });
  });

  describe('commitEdit', () => {
    it('applies edit through overlay and refreshes', async () => {
      const ctx = makeCtx();
      editing().init!(ctx);

      const state = ctx.editing!;
      const cell = { rowIndex: 0, colIndex: 1, rowId: '1', field: 'name', value: 'Alice' };
      await state.commitEdit(cell, 'Alicia');

      expect(ctx.emit).toHaveBeenCalledWith('edit:commit', { cell, value: 'Alicia' });
      expect(ctx.refresh).toHaveBeenCalled();
    });

    it('skips when column.editable is false', async () => {
      const ctx = makeCtx({
        columns: [
          { field: 'id', currentWidth: 80, editable: false },
          { field: 'name', currentWidth: 120 },
        ],
      });
      editing().init!(ctx);

      const state = ctx.editing!;
      const cell = { rowIndex: 0, colIndex: 0, rowId: '1', field: 'id', value: 1 };
      await state.commitEdit(cell, 999);

      // Should not emit edit:commit
      expect(ctx.emit).not.toHaveBeenCalledWith('edit:commit', expect.anything());
    });

    it('emits edit:invalid when validation fails', async () => {
      const ctx = makeCtx({
        columns: [
          { field: 'name', currentWidth: 120, validate: (v: unknown) => (v === '' ? 'Required' : true) },
        ],
      });
      editing().init!(ctx);

      const state = ctx.editing!;
      const cell = { rowIndex: 0, colIndex: 0, rowId: '1', field: 'name', value: 'Alice' };
      await state.commitEdit(cell, '');

      expect(ctx.emit).toHaveBeenCalledWith('edit:invalid', {
        cell,
        value: '',
        error: 'Required',
      });
      expect(ctx.refresh).not.toHaveBeenCalled();
    });

    it('does nothing when editing is disabled', async () => {
      const ctx = makeCtx();
      editing({ enabled: false }).init!(ctx);

      const state = ctx.editing!;
      const cell = { rowIndex: 0, colIndex: 1, rowId: '1', field: 'name', value: 'Alice' };
      await state.commitEdit(cell, 'Alicia');

      expect(ctx.refresh).not.toHaveBeenCalled();
    });
  });

  describe('undo/redo', () => {
    it('starts with canUndo=false and canRedo=false', () => {
      const ctx = makeCtx();
      editing().init!(ctx);

      const state = ctx.editing!;
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
    });

    it('canUndo becomes true after commitEdit', async () => {
      const ctx = makeCtx();
      editing().init!(ctx);

      const state = ctx.editing!;
      const cell = { rowIndex: 0, colIndex: 1, rowId: '1', field: 'name', value: 'Alice' };
      await state.commitEdit(cell, 'Alicia');

      // Re-read state after commit (it re-publishes)
      const updatedState = ctx.editing!;
      expect(updatedState.canUndo).toBe(true);
      expect(updatedState.canRedo).toBe(false);
    });

    it('undo then redo cycle works', async () => {
      const ctx = makeCtx();
      editing().init!(ctx);

      const cell = { rowIndex: 0, colIndex: 1, rowId: '1', field: 'name', value: 'Alice' };
      await ctx.editing!.commitEdit(cell, 'Alicia');
      expect(ctx.editing!.canUndo).toBe(true);

      await ctx.editing!.undo();
      expect(ctx.editing!.canUndo).toBe(false);
      expect(ctx.editing!.canRedo).toBe(true);

      await ctx.editing!.redo();
      expect(ctx.editing!.canUndo).toBe(true);
      expect(ctx.editing!.canRedo).toBe(false);
    });
  });

  describe('addRow', () => {
    it('adds row through overlay and emits event', async () => {
      const ctx = makeCtx();
      editing().init!(ctx);

      const data = { id: 99, name: 'New', price: 0 };
      await ctx.editing!.addRow(data);

      expect(ctx.emit).toHaveBeenCalledWith('row:add', data);
      expect(ctx.refresh).toHaveBeenCalled();
    });

    it('does nothing when disabled', async () => {
      const ctx = makeCtx();
      editing({ enabled: false }).init!(ctx);

      await ctx.editing!.addRow({ id: 99, name: 'New' });
      expect(ctx.emit).not.toHaveBeenCalledWith('row:add', expect.anything());
    });
  });

  describe('deleteRows', () => {
    it('deletes rows through overlay and emits event', async () => {
      const ctx = makeCtx();
      editing().init!(ctx);

      await ctx.editing!.deleteRows(['1']);

      expect(ctx.emit).toHaveBeenCalledWith('row:delete', ['1']);
      expect(ctx.refresh).toHaveBeenCalled();
    });

    it('does nothing with empty ids array', async () => {
      const ctx = makeCtx();
      editing().init!(ctx);

      await ctx.editing!.deleteRows([]);
      expect(ctx.emit).not.toHaveBeenCalledWith('row:delete', expect.anything());
    });

    it('does nothing when disabled', async () => {
      const ctx = makeCtx();
      editing({ enabled: false }).init!(ctx);

      await ctx.editing!.deleteRows(['1']);
      expect(ctx.emit).not.toHaveBeenCalledWith('row:delete', expect.anything());
    });
  });

  describe('editing:toggle event', () => {
    it('toggles enabled state', async () => {
      const ctx = makeCtx();
      const handlers: Record<string, Function> = {};
      (ctx as any).on = vi.fn((event: string, handler: Function) => {
        handlers[event] = handler;
        return vi.fn();
      });

      editing().init!(ctx);

      // Initially enabled — commit should work
      const cell = { rowIndex: 0, colIndex: 1, rowId: '1', field: 'name', value: 'Alice' };
      await ctx.editing!.commitEdit(cell, 'Alicia');
      expect(ctx.refresh).toHaveBeenCalled();

      vi.clearAllMocks();

      // Toggle off
      handlers['editing:toggle']();

      // Now commit should be skipped
      await ctx.editing!.commitEdit(cell, 'Bob');
      expect(ctx.refresh).not.toHaveBeenCalled();
    });
  });

  describe('editing:save event', () => {
    it('saves overlay and clears undo/redo', async () => {
      const ctx = makeCtx();
      const handlers: Record<string, Function> = {};
      (ctx as any).on = vi.fn((event: string, handler: Function) => {
        handlers[event] = handler;
        return vi.fn();
      });

      editing().init!(ctx);

      // Make an edit
      const cell = { rowIndex: 0, colIndex: 1, rowId: '1', field: 'name', value: 'Alice' };
      await ctx.editing!.commitEdit(cell, 'Alicia');
      expect(ctx.editing!.canUndo).toBe(true);

      // Save
      await handlers['editing:save']();

      // Undo/redo should be cleared
      expect(ctx.editing!.canUndo).toBe(false);
      expect(ctx.editing!.canRedo).toBe(false);
    });
  });

  describe('contextMenuItems', () => {
    it('returns separator and Delete row item', () => {
      const plugin = editing();
      const ctx = makeCtx();
      const cell = { rowIndex: 0, colIndex: 0, rowId: '1', field: 'id', value: 1 };
      const items = plugin.contextMenuItems!(ctx, cell);

      expect(items[0].type).toBe('separator');
      expect(items[1].label).toBe('Delete row');
      expect(items[1].danger).toBe(true);
    });
  });

  describe('undoDepth option', () => {
    it('limits undo stack to specified depth', async () => {
      const ctx = makeCtx();
      editing({ undoDepth: 2 }).init!(ctx);

      // Make 3 edits
      for (let i = 0; i < 3; i++) {
        const cell = { rowIndex: 0, colIndex: 1, rowId: '1', field: 'name', value: `v${i}` };
        await ctx.editing!.commitEdit(cell, `v${i + 1}`);
      }

      // Can undo, but stack is capped at 2
      expect(ctx.editing!.canUndo).toBe(true);
      await ctx.editing!.undo();
      expect(ctx.editing!.canUndo).toBe(true);
      await ctx.editing!.undo();
      // After 2 undos, stack should be empty
      expect(ctx.editing!.canUndo).toBe(false);
    });
  });
});
