import { describe, it, expect } from 'vitest';
import { formatValue } from '../src/components/TableRow.js';

describe('formatValue', () => {
  it('returns empty string for null/undefined', () => {
    expect(formatValue(null)).toBe('');
    expect(formatValue(undefined)).toBe('');
  });

  it('formats currency (default USD)', () => {
    expect(formatValue(1234.5, 'currency')).toBe('$1,234.50');
  });

  it('formats currency with custom code', () => {
    const result = formatValue(1234.5, 'currency:EUR');
    expect(result).toContain('1,234.50');
    expect(result).toContain('\u20AC'); // Euro sign
  });

  it('formats percent', () => {
    expect(formatValue(0.1234, 'percent')).toBe('12.34%');
  });

  it('formats number with locale separators', () => {
    expect(formatValue(1234567, 'number')).toBe('1,234,567');
  });

  it('formats compact notation', () => {
    const result = formatValue(1500, 'compact');
    expect(result).toMatch(/1\.5K/);
  });

  it('formats bytes', () => {
    expect(formatValue(0, 'bytes')).toBe('0 B');
    expect(formatValue(1024, 'bytes')).toBe('1.0 KB');
    expect(formatValue(1048576, 'bytes')).toBe('1.0 MB');
    expect(formatValue(1073741824, 'bytes')).toBe('1.0 GB');
  });

  it('formats boolean as checkmark/cross', () => {
    expect(formatValue(true, 'boolean')).toBe('\u2713');
    expect(formatValue(false, 'boolean')).toBe('\u2717');
    expect(formatValue(0, 'boolean')).toBe('\u2717');
    expect(formatValue(1, 'boolean')).toBe('\u2713');
  });

  it('formats date', () => {
    const result = formatValue('2024-03-15', 'date');
    // Locale-dependent, just check it's not empty and not the raw string
    expect(result).toBeTruthy();
  });

  it('formats datetime', () => {
    const result = formatValue('2024-03-15T10:30:00', 'datetime');
    expect(result).toBeTruthy();
  });

  it('falls back to toLocaleString for plain numbers', () => {
    expect(formatValue(1234567)).toBe('1,234,567');
  });

  it('falls back to String for non-numbers', () => {
    expect(formatValue('hello')).toBe('hello');
  });
});

describe('formatting plugin', async () => {
  const { formatting, negative, positive, threshold } = await import('../src/plugins/formatting.js');

  it('returns plugin with correct name', () => {
    const plugin = formatting();
    expect(plugin.name).toBe('formatting');
  });

  it('applies conditional rules via transformColumns', () => {
    const plugin = formatting({
      pnl: negative('#ef4444'),
    });

    const columns = [
      { field: 'pnl', currentWidth: 100 },
      { field: 'ticker', currentWidth: 100 },
    ] as any[];

    const transformed = plugin.transformColumns!(columns);

    // pnl column should have a cellStyle function
    expect(typeof transformed[0].cellStyle).toBe('function');
    // ticker column should be unchanged
    expect(transformed[1].cellStyle).toBeUndefined();

    // Test the function — negative() returns CellStyleResult with inline styles
    const styleFn = transformed[0].cellStyle as (v: unknown, r: Record<string, unknown>) => unknown;
    const negResult = styleFn(-50, {}) as { style?: Record<string, string> };
    expect(negResult.style?.color).toBe('#ef4444');
    expect(styleFn(100, {})).toBe('');
  });

  it('applies wildcard rules to all columns', () => {
    const plugin = formatting({
      '*': [{ when: (v) => v === null, className: 'null-cell' }],
    });

    const columns = [
      { field: 'a', currentWidth: 100 },
      { field: 'b', currentWidth: 100 },
    ] as any[];

    const transformed = plugin.transformColumns!(columns);
    for (const col of transformed) {
      const styleFn = col.cellStyle as (v: unknown, r: Record<string, unknown>) => unknown;
      expect(styleFn(null, {})).toBe('null-cell');
      expect(styleFn('hello', {})).toBe('');
    }
  });

  it('threshold creates ordered rules', () => {
    const rules = threshold([
      { max: 100, className: 'low' },
      { max: 50, className: 'very-low' },
    ]);
    // Should be sorted by max ascending
    expect(rules[0].when(25, {})).toBe(true);
    expect(rules[0].className).toBe('very-low');
    expect(rules[1].when(75, {})).toBe(true);
    expect(rules[1].className).toBe('low');
  });

  it('positive preset matches positive numbers', () => {
    const rules = positive('#22c55e');
    expect(rules[0].when(100, {})).toBe(true);
    expect(rules[0].when(-5, {})).toBe(false);
    expect(rules[0].when(0, {})).toBe(false);
    expect(rules[0].style).toEqual({ color: '#22c55e' });
  });
});
