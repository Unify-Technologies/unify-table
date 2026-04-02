import type { TablePlugin, TableContext } from '../types.js';
import type { SortField, FilterExpr } from '@unify/table-core';

interface ViewState {
  sort: SortField[];
  filters: FilterExpr[];
  groupBy: string[];
  columnWidths: Record<string, number>;
  columnOrder: string[];
}

const savedViews = new Map<string, ViewState>();

export function views(): TablePlugin {
  return {
    name: 'views',
  };
}

export function saveView(name: string, ctx: TableContext): void {
  savedViews.set(name, {
    sort: [...ctx.sort],
    filters: [...ctx.filters],
    groupBy: [...ctx.groupBy],
    columnWidths: Object.fromEntries(ctx.columns.map((c) => [c.field, c.currentWidth])),
    columnOrder: ctx.columns.map((c) => c.field),
  });
}

export function applyView(name: string, ctx: TableContext): boolean {
  const view = savedViews.get(name);
  if (!view) return false;
  ctx.setSort(view.sort);
  ctx.setFilters(view.filters);
  ctx.setGroupBy(view.groupBy);
  for (const [field, width] of Object.entries(view.columnWidths)) {
    ctx.setColumnWidth(field, width);
  }
  ctx.setColumnOrder(view.columnOrder);
  return true;
}

export function listViews(): string[] {
  return [...savedViews.keys()];
}

export function serializeViews(): string {
  return JSON.stringify([...savedViews.entries()]);
}
