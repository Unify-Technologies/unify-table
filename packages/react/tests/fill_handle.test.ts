import { describe, it, expect } from 'vitest';
import { detectPattern } from '../src/plugins/fill_handle.js';

describe('detectPattern', () => {
  it('returns null for empty values', () => {
    const pattern = detectPattern([]);
    expect(pattern(0)).toBe(null);
  });

  it('copies a single value', () => {
    const pattern = detectPattern([42]);
    expect(pattern(0)).toBe(42);
    expect(pattern(5)).toBe(42);
  });

  it('detects arithmetic progression (integers)', () => {
    const pattern = detectPattern([1, 2, 3]);
    expect(pattern(0)).toBe(4);
    expect(pattern(1)).toBe(5);
    expect(pattern(2)).toBe(6);
  });

  it('detects arithmetic progression (step 5)', () => {
    const pattern = detectPattern([10, 15, 20]);
    expect(pattern(0)).toBe(25);
    expect(pattern(1)).toBe(30);
  });

  it('detects arithmetic progression (negative step)', () => {
    const pattern = detectPattern([100, 90, 80]);
    expect(pattern(0)).toBe(70);
    expect(pattern(1)).toBe(60);
  });

  it('detects constant number (step 0)', () => {
    const pattern = detectPattern([5, 5, 5]);
    expect(pattern(0)).toBe(5);
    expect(pattern(3)).toBe(5);
  });

  it('cycles through non-progressive numbers', () => {
    const pattern = detectPattern([1, 5, 2]);
    expect(pattern(0)).toBe(1);
    expect(pattern(1)).toBe(5);
    expect(pattern(2)).toBe(2);
    expect(pattern(3)).toBe(1);
  });

  it('detects date progression (daily)', () => {
    const pattern = detectPattern(['2024-01-01', '2024-01-02', '2024-01-03']);
    expect(pattern(0)).toBe('2024-01-04');
    expect(pattern(1)).toBe('2024-01-05');
  });

  it('cycles text values', () => {
    const pattern = detectPattern(['A', 'B', 'C']);
    expect(pattern(0)).toBe('A');
    expect(pattern(1)).toBe('B');
    expect(pattern(2)).toBe('C');
    expect(pattern(3)).toBe('A');
  });

  it('copies single text value', () => {
    const pattern = detectPattern(['hello']);
    expect(pattern(0)).toBe('hello');
    expect(pattern(5)).toBe('hello');
  });

  it('handles decimal arithmetic progression', () => {
    const pattern = detectPattern([0.1, 0.2, 0.3]);
    expect(pattern(0)).toBeCloseTo(0.4);
    expect(pattern(1)).toBeCloseTo(0.5);
  });

  it('handles two-value arithmetic progression', () => {
    const pattern = detectPattern([10, 20]);
    expect(pattern(0)).toBe(30);
    expect(pattern(1)).toBe(40);
  });
});

describe('formulas plugin', () => {
  it('creates per-instance formula columns', async () => {
    const { formulas } = await import('../src/plugins/formulas.js');

    const plugin1 = formulas({ columns: [{ name: 'a', expression: '1+1' }] });
    const plugin2 = formulas({ columns: [{ name: 'b', expression: '2+2' }] });

    const baseCols = [{ field: 'id', currentWidth: 100 }] as any[];
    const cols1 = plugin1.transformColumns!(baseCols);
    const cols2 = plugin2.transformColumns!(baseCols);

    expect(cols1).toHaveLength(2);
    expect(cols1[1].field).toBe('a');
    expect(cols1[1]._isFormula).toBe(true);
    expect(cols1[1].editable).toBe(false);

    expect(cols2).toHaveLength(2);
    expect(cols2[1].field).toBe('b');
    expect(cols2[1]._isFormula).toBe(true);
  });

  it('formula columns are non-editable by default', async () => {
    const { formulas } = await import('../src/plugins/formulas.js');
    const plugin = formulas({ columns: [{ name: 'total', expression: 'a * b' }] });
    const cols = plugin.transformColumns!([{ field: 'a', currentWidth: 100 }] as any[]);
    expect(cols[1].editable).toBe(false);
  });

  it('formula columns can be made editable', async () => {
    const { formulas } = await import('../src/plugins/formulas.js');
    const plugin = formulas({ columns: [
      { name: 'editable_col', expression: 'a + b', editable: true },
      { name: 'readonly_col', expression: 'c + d' },
    ] });
    const cols = plugin.transformColumns!([{ field: 'a', currentWidth: 100 }] as any[]);
    expect(cols[1].editable).toBe(true);
    expect(cols[1]._isFormula).toBe(true);
    expect(cols[2].editable).toBe(false);
    expect(cols[2]._isFormula).toBe(true);
  });

  it('formula columns include _formulaExpression', async () => {
    const { formulas } = await import('../src/plugins/formulas.js');
    const plugin = formulas({ columns: [
      { name: 'total', expression: 'price * quantity' },
      { name: 'margin', expression: 'ROUND(pnl / NULLIF(notional, 0) * 100, 2)' },
    ] });
    const cols = plugin.transformColumns!([{ field: 'id', currentWidth: 100 }] as any[]);

    expect(cols[1]._formulaExpression).toBe('price * quantity');
    expect(cols[2]._formulaExpression).toBe('ROUND(pnl / NULLIF(notional, 0) * 100, 2)');
  });

  it('per-instance isolation — expressions do not leak', async () => {
    const { formulas } = await import('../src/plugins/formulas.js');
    const p1 = formulas({ columns: [{ name: 'x', expression: 'a + b' }] });
    const p2 = formulas({ columns: [{ name: 'y', expression: 'c + d' }] });

    const base = [{ field: 'id', currentWidth: 100 }] as any[];
    const c1 = p1.transformColumns!(base);
    const c2 = p2.transformColumns!(base);

    expect(c1).toHaveLength(2);
    expect(c1[1].field).toBe('x');
    expect(c2).toHaveLength(2);
    expect(c2[1].field).toBe('y');
    // No cross-contamination
    expect(c1.find((c: any) => c.field === 'y')).toBeUndefined();
    expect(c2.find((c: any) => c.field === 'x')).toBeUndefined();
  });
});
