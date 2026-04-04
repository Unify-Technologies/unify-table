import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formulas } from '../src/plugins/formulas.js';
import type { TableContext, ResolvedColumn, FormulasState } from '../src/types.js';

function makeCols(...fields: string[]): ResolvedColumn[] {
  return fields.map((f) => ({ field: f, currentWidth: 100 })) as ResolvedColumn[];
}

function makeCtx(overrides: Record<string, any> = {}): TableContext {
  let formulasState: FormulasState | null = null;
  const ctx: any = {
    table: 'trades',
    rows: [],
    columns: makeCols('id', 'price', 'qty'),
    datasource: { filters: [], sort: [] },
    viewManager: {
      setSelectExpressions: vi.fn(),
      sync: vi.fn().mockResolvedValue(undefined),
    },
    containerRef: { current: null },
    refresh: vi.fn().mockResolvedValue(undefined),
    on: vi.fn().mockReturnValue(vi.fn()),
    emit: vi.fn(),
    get formulas() { return formulasState; },
    _setFormulas: vi.fn((state: FormulasState | null) => { formulasState = state; }),
    getLatest: () => ctx,
    ...overrides,
  };
  return ctx;
}

describe('formulas plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has correct name', () => {
    const plugin = formulas({ columns: [] });
    expect(plugin.name).toBe('formulas');
  });

  describe('transformColumns', () => {
    it('appends formula columns to existing columns', () => {
      const plugin = formulas({
        columns: [
          { name: 'total', expression: 'price * qty' },
          { name: 'pnl', expression: 'price - cost', label: 'P&L', width: 200 },
        ],
      });
      const base = makeCols('id', 'price');
      const result = plugin.transformColumns!(base);

      expect(result).toHaveLength(4);
      expect(result[2].field).toBe('total');
      expect(result[2]._isFormula).toBe(true);
      expect(result[2]._formulaExpression).toBe('price * qty');
      expect(result[2].currentWidth).toBe(150); // default

      expect(result[3].field).toBe('pnl');
      expect(result[3].label).toBe('P&L');
      expect(result[3].currentWidth).toBe(200);
    });

    it('sets editable to false by default', () => {
      const plugin = formulas({
        columns: [{ name: 'total', expression: 'price * qty' }],
      });
      const result = plugin.transformColumns!(makeCols('id'));
      expect(result[1].editable).toBe(false);
    });

    it('respects editable option', () => {
      const plugin = formulas({
        columns: [{ name: 'total', expression: 'price * qty', editable: true }],
      });
      const result = plugin.transformColumns!(makeCols('id'));
      expect(result[1].editable).toBe(true);
    });

    it('sets formula columns as sortable and filterable', () => {
      const plugin = formulas({
        columns: [{ name: 'total', expression: 'price * qty' }],
      });
      const result = plugin.transformColumns!(makeCols('id'));
      expect(result[1].sortable).toBe(true);
      expect(result[1].filterable).toBe(true);
      expect(result[1].resizable).toBe(true);
    });

    it('uses name as label when no label provided', () => {
      const plugin = formulas({
        columns: [{ name: 'total', expression: 'price * qty' }],
      });
      const result = plugin.transformColumns!(makeCols('id'));
      expect(result[1].label).toBe('total');
    });

    it('does not share state between instances', () => {
      const plugin1 = formulas({
        columns: [{ name: 'a', expression: '1+1' }],
      });
      const plugin2 = formulas({
        columns: [{ name: 'b', expression: '2+2' }],
      });

      const result1 = plugin1.transformColumns!(makeCols('id'));
      const result2 = plugin2.transformColumns!(makeCols('id'));

      expect(result1[1].field).toBe('a');
      expect(result2[1].field).toBe('b');
    });
  });

  describe('init', () => {
    it('publishes FormulasState', () => {
      const ctx = makeCtx();
      const plugin = formulas({
        columns: [{ name: 'total', expression: 'price * qty' }],
      });
      plugin.init!(ctx);

      expect(ctx._setFormulas).toHaveBeenCalled();
      const state = ctx.formulas!;
      expect(typeof state.getExpression).toBe('function');
      expect(typeof state.updateExpression).toBe('function');
      expect(typeof state.undo).toBe('function');
      expect(typeof state.redo).toBe('function');
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
    });

    it('syncs expressions to ViewManager', () => {
      const ctx = makeCtx();
      formulas({
        columns: [{ name: 'total', expression: 'price * qty' }],
      }).init!(ctx);

      expect(ctx.viewManager.setSelectExpressions).toHaveBeenCalledWith([
        { expression: 'price * qty', alias: 'total' },
      ]);
      expect(ctx.viewManager.sync).toHaveBeenCalled();
    });

    it('returns cleanup that clears formulas state', () => {
      const ctx = makeCtx();
      const cleanup = formulas({
        columns: [{ name: 'total', expression: 'price * qty' }],
      }).init!(ctx);

      expect(typeof cleanup).toBe('function');
      cleanup!();

      expect(ctx._setFormulas).toHaveBeenCalledWith(null);
      expect(ctx.viewManager.setSelectExpressions).toHaveBeenCalledWith([]);
    });
  });

  describe('FormulasState', () => {
    it('getExpression returns current expression', () => {
      const ctx = makeCtx();
      formulas({
        columns: [{ name: 'total', expression: 'price * qty' }],
      }).init!(ctx);

      expect(ctx.formulas!.getExpression('total')).toBe('price * qty');
    });

    it('getExpression returns undefined for unknown name', () => {
      const ctx = makeCtx();
      formulas({
        columns: [{ name: 'total', expression: 'price * qty' }],
      }).init!(ctx);

      expect(ctx.formulas!.getExpression('nonexistent')).toBeUndefined();
    });

    it('updateExpression changes expression and enables undo', async () => {
      const ctx = makeCtx();
      formulas({
        columns: [{ name: 'total', expression: 'price * qty' }],
      }).init!(ctx);

      await ctx.formulas!.updateExpression('total', 'price + qty');

      expect(ctx.formulas!.getExpression('total')).toBe('price + qty');
      expect(ctx.formulas!.canUndo).toBe(true);
      expect(ctx.formulas!.canRedo).toBe(false);
      expect(ctx.refresh).toHaveBeenCalled();
    });

    it('undo restores previous expression', async () => {
      const ctx = makeCtx();
      formulas({
        columns: [{ name: 'total', expression: 'price * qty' }],
      }).init!(ctx);

      await ctx.formulas!.updateExpression('total', 'price + qty');
      await ctx.formulas!.undo();

      expect(ctx.formulas!.getExpression('total')).toBe('price * qty');
      expect(ctx.formulas!.canUndo).toBe(false);
      expect(ctx.formulas!.canRedo).toBe(true);
    });

    it('redo restores undone expression', async () => {
      const ctx = makeCtx();
      formulas({
        columns: [{ name: 'total', expression: 'price * qty' }],
      }).init!(ctx);

      await ctx.formulas!.updateExpression('total', 'price + qty');
      await ctx.formulas!.undo();
      await ctx.formulas!.redo();

      expect(ctx.formulas!.getExpression('total')).toBe('price + qty');
      expect(ctx.formulas!.canUndo).toBe(true);
      expect(ctx.formulas!.canRedo).toBe(false);
    });

    it('updateExpression clears redo stack', async () => {
      const ctx = makeCtx();
      formulas({
        columns: [{ name: 'total', expression: 'price * qty' }],
      }).init!(ctx);

      await ctx.formulas!.updateExpression('total', 'price + qty');
      await ctx.formulas!.undo();
      expect(ctx.formulas!.canRedo).toBe(true);

      // New update should clear redo
      await ctx.formulas!.updateExpression('total', 'price - qty');
      expect(ctx.formulas!.canRedo).toBe(false);
    });
  });
});
