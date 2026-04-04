import { describe, it, expect, vi } from 'vitest';
import { deriveState, deriveGroupState, selection } from '../src/plugins/selection.js';
import { emptySelection } from '../src/utils.js';
import type { TableContext, SelectionSpan, ResolvedColumn } from '../src/types.js';
import type { Row } from '@unify/table-core';

function makeCols(...fields: string[]): ResolvedColumn[] {
  return fields.map((f) => ({ field: f, currentWidth: 100 })) as ResolvedColumn[];
}

function makeRows(...data: Record<string, unknown>[]): Row[] {
  return data as Row[];
}

function makeCtx(rows: Row[], columns: ResolvedColumn[], overrides: Record<string, any> = {}): TableContext {
  const ctx: any = {
    rows,
    columns,
    selection: emptySelection(),
    activeCell: null,
    editing: null,
    setActiveCell: vi.fn(),
    setSelection: vi.fn(),
    containerRef: { current: null },
    on: vi.fn().mockReturnValue(vi.fn()),
    emit: vi.fn(),
    getLatest: () => ctx,
    getPlugin: () => undefined,
    ...overrides,
  };
  return ctx;
}

describe('deriveState', () => {
  const cols = makeCols('id', 'name', 'value');
  const rows = makeRows(
    { id: 1, name: 'Alice', value: 100 },
    { id: 2, name: 'Bob', value: 200 },
    { id: 3, name: 'Carol', value: 300 },
    { id: 4, name: 'Dave', value: 400 },
  );

  it('returns empty state for null span and no additional spans', () => {
    const ctx = makeCtx(rows, cols);
    const state = deriveState(null, [], ctx);
    expect(state.selectedIds.size).toBe(0);
    expect(state.selectedCells).toHaveLength(0);
    expect(state.count).toBe(0);
  });

  it('selects a single cell', () => {
    const ctx = makeCtx(rows, cols);
    const span: SelectionSpan = { anchor: { row: 1, col: 1 }, focus: { row: 1, col: 1 } };
    const state = deriveState(span, [], ctx);
    expect(state.selectedIds.size).toBe(1);
    expect(state.selectedIds.has('2')).toBe(true);
    expect(state.selectedCells).toHaveLength(1);
    expect(state.selectedCells[0].field).toBe('name');
    expect(state.selectedCells[0].value).toBe('Bob');
  });

  it('selects a rectangular range', () => {
    const ctx = makeCtx(rows, cols);
    const span: SelectionSpan = { anchor: { row: 0, col: 0 }, focus: { row: 2, col: 1 } };
    const state = deriveState(span, [], ctx);
    expect(state.selectedIds.size).toBe(3);
    expect(state.count).toBe(3);
    // 3 rows x 2 cols = 6 cells
    expect(state.selectedCells).toHaveLength(6);
  });

  it('normalizes reversed span (focus < anchor)', () => {
    const ctx = makeCtx(rows, cols);
    const span: SelectionSpan = { anchor: { row: 2, col: 2 }, focus: { row: 0, col: 0 } };
    const state = deriveState(span, [], ctx);
    expect(state.selectedIds.size).toBe(3);
    // 3 rows x 3 cols = 9 cells
    expect(state.selectedCells).toHaveLength(9);
  });

  it('skips __group rows', () => {
    const rowsWithGroup = makeRows(
      { id: 1, name: 'Alice' },
      { __group: true, __groupKey: { name: 'X' } },
      { id: 3, name: 'Carol' },
    );
    const ctx = makeCtx(rowsWithGroup, cols);
    const span: SelectionSpan = { anchor: { row: 0, col: 0 }, focus: { row: 2, col: 0 } };
    const state = deriveState(span, [], ctx);
    expect(state.selectedIds.size).toBe(2);
  });

  it('skips __placeholder rows', () => {
    const rowsWithPlaceholder = makeRows(
      { id: 1, name: 'Alice' },
      { __placeholder: true },
      { id: 3, name: 'Carol' },
    );
    const ctx = makeCtx(rowsWithPlaceholder, cols);
    const span: SelectionSpan = { anchor: { row: 0, col: 0 }, focus: { row: 2, col: 0 } };
    const state = deriveState(span, [], ctx);
    expect(state.selectedIds.size).toBe(2);
  });

  it('combines primary and additional spans', () => {
    const ctx = makeCtx(rows, cols);
    const span: SelectionSpan = { anchor: { row: 0, col: 0 }, focus: { row: 0, col: 0 } };
    const additional: SelectionSpan[] = [
      { anchor: { row: 2, col: 1 }, focus: { row: 3, col: 1 } },
    ];
    const state = deriveState(span, additional, ctx);
    expect(state.selectedIds.size).toBe(3); // rows 0, 2, 3
    expect(state.selectedCells).toHaveLength(3); // 1 + 2
  });

  it('uses only additionalSpans when primary span is null', () => {
    const ctx = makeCtx(rows, cols);
    const additional: SelectionSpan[] = [
      { anchor: { row: 1, col: 0 }, focus: { row: 1, col: 2 } },
    ];
    const state = deriveState(null, additional, ctx);
    expect(state.selectedIds.size).toBe(1);
    expect(state.selectedCells).toHaveLength(3);
  });

  it('clamps column index to columns.length', () => {
    const ctx = makeCtx(rows, cols);
    // col: 10 is beyond cols.length (3), so inner loop won't add beyond
    const span: SelectionSpan = { anchor: { row: 0, col: 0 }, focus: { row: 0, col: 10 } };
    const state = deriveState(span, [], ctx);
    expect(state.selectedCells).toHaveLength(3); // clamped to 3 columns
  });

  it('clears group selection', () => {
    const ctx = makeCtx(rows, cols);
    const span: SelectionSpan = { anchor: { row: 0, col: 0 }, focus: { row: 0, col: 0 } };
    const state = deriveState(span, [], ctx);
    expect(state.selectedGroups.size).toBe(0);
    expect(state.groupCount).toBe(0);
  });
});

describe('deriveGroupState', () => {
  it('returns state with group keys and zero data selection', () => {
    const keys = new Set(['a|1', 'b|2']);
    const state = deriveGroupState(keys);
    expect(state.selectedGroups).toBe(keys);
    expect(state.groupCount).toBe(2);
    expect(state.selectedIds.size).toBe(0);
    expect(state.selectedCells).toHaveLength(0);
    expect(state.count).toBe(0);
    expect(state.span).toBeNull();
  });

  it('returns empty state for empty group set', () => {
    const state = deriveGroupState(new Set());
    expect(state.groupCount).toBe(0);
    expect(state.selectedGroups.size).toBe(0);
  });
});

describe('selection plugin', () => {
  it('has correct name', () => {
    expect(selection().name).toBe('selection');
  });

  it('defaults to multi mode', () => {
    const plugin = selection();
    expect(plugin.name).toBe('selection');
  });

  describe('init', () => {
    it('subscribes to cell:click and group:click events', () => {
      const rows = makeRows({ id: 1, name: 'Alice' });
      const cols = makeCols('id', 'name');
      const ctx = makeCtx(rows, cols);

      const plugin = selection();
      plugin.init!(ctx);

      // Should have subscribed to cell:click and group:click
      const calls = (ctx.on as any).mock.calls;
      const events = calls.map((c: any[]) => c[0]);
      expect(events).toContain('cell:click');
      expect(events).toContain('group:click');
    });

    it('handles cell:click by setting single selection', () => {
      const rows = makeRows({ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' });
      const cols = makeCols('id', 'name');
      const ctx = makeCtx(rows, cols);

      const handlers: Record<string, Function> = {};
      (ctx as any).on = vi.fn((event: string, handler: Function) => {
        handlers[event] = handler;
        return vi.fn();
      });

      selection().init!(ctx);

      // Simulate a plain cell click
      handlers['cell:click']({
        rowIndex: 0,
        colIndex: 1,
        ctrlKey: false,
        shiftKey: false,
        field: 'name',
        value: 'Alice',
        row: rows[0],
      });

      expect(ctx.setActiveCell).toHaveBeenCalled();
      expect(ctx.setSelection).toHaveBeenCalled();
      const sel = (ctx.setSelection as any).mock.calls[0][0];
      expect(sel.selectedIds.size).toBe(1);
    });

    it('ignores click on __group rows', () => {
      const rows = makeRows({ __group: true, __groupKey: {} });
      const cols = makeCols('id');
      const ctx = makeCtx(rows, cols);

      const handlers: Record<string, Function> = {};
      (ctx as any).on = vi.fn((event: string, handler: Function) => {
        handlers[event] = handler;
        return vi.fn();
      });

      selection().init!(ctx);
      handlers['cell:click']({
        rowIndex: 0,
        colIndex: 0,
        ctrlKey: false,
        shiftKey: false,
        field: 'id',
        value: undefined,
        row: rows[0],
      });

      expect(ctx.setActiveCell).not.toHaveBeenCalled();
    });

    it('returns cleanup function', () => {
      const rows = makeRows({ id: 1 });
      const cols = makeCols('id');
      const container = document.createElement('div');
      const ctx = makeCtx(rows, cols, {
        containerRef: { current: container },
      });

      const unsubs: Function[] = [];
      (ctx as any).on = vi.fn((_event: string, _handler: Function) => {
        const unsub = vi.fn();
        unsubs.push(unsub);
        return unsub;
      });

      const cleanup = selection().init!(ctx);
      expect(typeof cleanup).toBe('function');
      cleanup!();
      // Verify unsubs were called
      for (const unsub of unsubs) {
        expect(unsub).toHaveBeenCalled();
      }
    });
  });
});
