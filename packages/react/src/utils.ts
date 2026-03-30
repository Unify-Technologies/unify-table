import type { Row } from '@unify/table-core';
import type { SelectionState } from './types.js';

/** Common ID field candidates for row identification. */
export const ID_CANDIDATES = ['id', 'ID', '_id', 'rowid'] as const;

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

/** Download a Blob as a file. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
