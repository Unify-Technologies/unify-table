import { describe, it, expect, vi } from 'vitest';
import { columnReorder } from '../src/plugins/column_reorder.js';

describe('columnReorder plugin', () => {
  function makeCtx(columns: any[]) {
    const ctx: any = {
      containerRef: { current: null },
      columns,
      setColumnOrder: vi.fn(),
      emit: vi.fn(),
      getLatest: () => ctx,
    };
    return ctx;
  }

  it('cancels dragstart when target is inside a resize separator', () => {
    const plugin = columnReorder();

    const container = document.createElement('div');
    const header = document.createElement('div');
    header.setAttribute('role', 'columnheader');
    header.setAttribute('data-field', 'ticker');
    const separator = document.createElement('div');
    separator.setAttribute('role', 'separator');
    const indicator = document.createElement('div');
    separator.appendChild(indicator);
    header.appendChild(separator);
    container.appendChild(header);

    const ctx = makeCtx([{ field: 'ticker', currentWidth: 150 }]);
    ctx.containerRef.current = container;

    const cleanup = plugin.init!(ctx);

    const event = new Event('dragstart', { bubbles: true }) as DragEvent;
    Object.defineProperty(event, 'dataTransfer', { value: { effectAllowed: '', setData: vi.fn() } });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    indicator.dispatchEvent(event);

    expect(preventSpy).toHaveBeenCalled();
    expect(ctx.setColumnOrder).not.toHaveBeenCalled();

    cleanup?.();
  });

  it('creates plugin with correct name', () => {
    const plugin = columnReorder();
    expect(plugin.name).toBe('columnReorder');
  });

  it('transformColumns returns new column objects for non-pinned', () => {
    const plugin = columnReorder();
    const columns = [
      { field: 'id', currentWidth: 100, pin: 'left' as const },
      { field: 'ticker', currentWidth: 150 },
      { field: 'pnl', currentWidth: 120 },
    ] as any[];

    const transformed = plugin.transformColumns!(columns);

    // Pinned column should be same reference (unchanged)
    expect(transformed[0]).toBe(columns[0]);
    // Non-pinned columns should be new objects
    expect(transformed[1]).not.toBe(columns[1]);
    expect(transformed[1].field).toBe('ticker');
  });

  it('uses data-field attribute for field lookup instead of index', () => {
    const plugin = columnReorder();

    const container = document.createElement('div');
    const headerRow = document.createElement('div');

    const h1 = document.createElement('div');
    h1.setAttribute('role', 'columnheader');
    h1.setAttribute('data-field', 'a');
    const h2 = document.createElement('div');
    h2.setAttribute('role', 'columnheader');
    h2.setAttribute('data-field', 'b');
    const h3 = document.createElement('div');
    h3.setAttribute('role', 'columnheader');
    h3.setAttribute('data-field', 'c');

    headerRow.appendChild(h1);
    headerRow.appendChild(h2);
    headerRow.appendChild(h3);
    container.appendChild(headerRow);

    const ctx = makeCtx([
      { field: 'a', currentWidth: 100 },
      { field: 'b', currentWidth: 100 },
      { field: 'c', currentWidth: 100 },
    ]);
    ctx.containerRef.current = container;

    const cleanup = plugin.init!(ctx);

    // Drag 'a' and drop on 'c' → inserts before c → [b, a, c]
    const startEvent = new Event('dragstart', { bubbles: true }) as DragEvent;
    Object.defineProperty(startEvent, 'dataTransfer', { value: { effectAllowed: '', setData: vi.fn() } });
    h1.dispatchEvent(startEvent);

    const overEvent = new Event('dragover', { bubbles: true }) as DragEvent;
    Object.defineProperty(overEvent, 'dataTransfer', { value: { dropEffect: '' } });
    h3.dispatchEvent(overEvent);

    const dropEvent = new Event('drop', { bubbles: true }) as DragEvent;
    Object.defineProperty(dropEvent, 'dataTransfer', { value: {} });
    h3.dispatchEvent(dropEvent);

    expect(ctx.setColumnOrder).toHaveBeenCalledWith(['b', 'a', 'c']);

    cleanup?.();
  });

  it('uses getLatest() to read current columns', () => {
    const plugin = columnReorder();

    const container = document.createElement('div');
    const headerRow = document.createElement('div');

    const h1 = document.createElement('div');
    h1.setAttribute('role', 'columnheader');
    h1.setAttribute('data-field', 'a');
    const h2 = document.createElement('div');
    h2.setAttribute('role', 'columnheader');
    h2.setAttribute('data-field', 'b');
    const h3 = document.createElement('div');
    h3.setAttribute('role', 'columnheader');
    h3.setAttribute('data-field', 'c');

    headerRow.appendChild(h1);
    headerRow.appendChild(h2);
    headerRow.appendChild(h3);
    container.appendChild(headerRow);

    // Initial columns: a, b, c
    const ctx = makeCtx([
      { field: 'a', currentWidth: 100 },
      { field: 'b', currentWidth: 100 },
      { field: 'c', currentWidth: 100 },
    ]);
    ctx.containerRef.current = container;

    const cleanup = plugin.init!(ctx);

    // Simulate columns being reordered externally to: b, a, c
    ctx.columns = [
      { field: 'b', currentWidth: 100 },
      { field: 'a', currentWidth: 100 },
      { field: 'c', currentWidth: 100 },
    ];

    // Now drag c before b — should use updated columns
    const startEvent = new Event('dragstart', { bubbles: true }) as DragEvent;
    Object.defineProperty(startEvent, 'dataTransfer', { value: { effectAllowed: '', setData: vi.fn() } });
    h3.dispatchEvent(startEvent);

    const overEvent = new Event('dragover', { bubbles: true }) as DragEvent;
    Object.defineProperty(overEvent, 'dataTransfer', { value: { dropEffect: '' } });
    h1.dispatchEvent(overEvent); // h1 has data-field="a"

    const dropEvent = new Event('drop', { bubbles: true }) as DragEvent;
    Object.defineProperty(dropEvent, 'dataTransfer', { value: {} });
    h1.dispatchEvent(dropEvent);

    // From [b, a, c], move c before a → [b, c, a]
    expect(ctx.setColumnOrder).toHaveBeenCalledWith(['b', 'c', 'a']);

    cleanup?.();
  });
});
