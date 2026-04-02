import type { Row } from '@unify/table-core';
import type { SelectionState, TableContext, MenuItem, ResolvedColumn } from './types.js';

/** Common ID field candidates for row identification. */
export const ID_CANDIDATES = ['id', 'ID', '_id', 'rowid', '__table_rid'] as const;

/**
 * Normalize a KeyboardEvent into a canonical shortcut string.
 * e.g. Ctrl+Shift+F becomes "ctrl+shift+f", ArrowDown becomes "arrowdown".
 */
export function normalizeShortcut(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('ctrl');
  if (e.shiftKey) parts.push('shift');
  if (e.altKey) parts.push('alt');
  if (!['Control', 'Meta', 'Shift', 'Alt'].includes(e.key)) {
    parts.push(e.key.toLowerCase());
  }
  return parts.join('+');
}

/** Normalize a declared shortcut key to canonical form. e.g. "Ctrl+F" -> "ctrl+f" */
export function normalizeShortcutKey(key: string): string {
  return key.toLowerCase();
}

/** Create an empty selection state. */
export function emptySelection(): SelectionState {
  return { span: null, additionalSpans: [], selectedIds: new Set(), selectedCells: [], count: 0, asFilter: () => null, selectedGroups: new Set(), groupCount: 0 };
}

/** Try to get a stable row ID from a row object. */
export function getRowId(row: Row, index: number): string {
  for (const key of ID_CANDIDATES) {
    if (row[key] !== undefined) return String(row[key]);
  }
  return String(index);
}

/** Detect the ID column name from a list of columns. */
export function detectIdColumn(columns: { field: string }[]): string {
  for (const k of ID_CANDIDATES) {
    if (columns.some((c) => c.field === k)) return k;
  }
  return 'id';
}

/** Detect the ID column name from engine columns (by `name` field). */
export function detectIdColumnByName(columns: { name: string }[]): string {
  for (const k of ID_CANDIDATES) {
    if (columns.some((c) => c.name === k)) return k;
  }
  return '';
}

/** Get selection span dimensions (rows x cols) across all spans. */
export function spanDims(ctx: TableContext): { rows: number; cols: number } {
  const sel = ctx.selection;
  if (!sel.span) return { rows: 0, cols: 0 };
  const allSpans = [sel.span, ...sel.additionalSpans];
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
  for (const s of allSpans) {
    minR = Math.min(minR, s.anchor.row, s.focus.row);
    maxR = Math.max(maxR, s.anchor.row, s.focus.row);
    minC = Math.min(minC, s.anchor.col, s.focus.col);
    maxC = Math.max(maxC, s.anchor.col, s.focus.col);
  }
  return { rows: maxR - minR + 1, cols: maxC - minC + 1 };
}

/** Build pin style for a column (sticky positioning + shadow). */
export function buildPinStyle(col: ResolvedColumn, zIndex = 1): React.CSSProperties {
  if (!col.pin) return {};
  return {
    position: 'sticky',
    zIndex,
    backgroundColor: 'var(--utbl-row-bg, inherit)',
    ...(col.pin === 'left' ? { left: col._pinOffset ?? 0 } : { right: col._pinOffset ?? 0 }),
    ...(col._pinEdge ? { boxShadow: col.pin === 'left' ? '4px 0 8px -4px rgba(0,0,0,0.15)' : '-4px 0 8px -4px rgba(0,0,0,0.15)' } : {}),
  };
}

/** Menu separator constant for context menus. */
export const MENU_SEPARATOR: MenuItem = { label: '', action: () => {}, type: 'separator' };

/** Download a Blob as a file. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
