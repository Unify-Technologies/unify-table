import type { TablePlugin, TableContext, SelectionState, SelectionSpan, CellRef } from '../types.js';
import type { Row } from '@unify/table-core';
import { getRowId, emptySelection } from '../utils.js';
import { isGroupRow, serializeGroupKey } from './row_grouping.js';

type SelectionMode = 'single' | 'multi' | 'range';

/** Derive selectedIds and selectedCells from spans (data rows only, clears group selection). */
function deriveState(
  span: SelectionSpan | null,
  additionalSpans: SelectionSpan[],
  ctx: TableContext,
): SelectionState {
  const ids = new Set<string>();
  const cells: CellRef[] = [];
  const allSpans = span ? [span, ...additionalSpans] : additionalSpans;

  for (const s of allSpans) {
    const r0 = Math.min(s.anchor.row, s.focus.row);
    const r1 = Math.max(s.anchor.row, s.focus.row);
    const c0 = Math.min(s.anchor.col, s.focus.col);
    const c1 = Math.max(s.anchor.col, s.focus.col);
    for (let r = r0; r <= r1; r++) {
      const row = ctx.rows[r];
      if (!row || row.__placeholder === true || row.__group === true) continue;
      const rowId = getRowId(row, r);
      ids.add(rowId);
      for (let c = c0; c <= c1 && c < ctx.columns.length; c++) {
        const col = ctx.columns[c];
        cells.push({ rowIndex: r, colIndex: c, rowId, field: col.field, value: row[col.field] });
      }
    }
  }

  return {
    span,
    additionalSpans,
    selectedIds: ids,
    selectedCells: cells,
    count: ids.size,
    asFilter: () => null,
    selectedGroups: new Set(),
    groupCount: 0,
  };
}

/** Create a SelectionState for group-only selection (clears data selection). */
function deriveGroupState(groupKeys: Set<string>): SelectionState {
  return {
    span: null,
    additionalSpans: [],
    selectedIds: new Set(),
    selectedCells: [],
    count: 0,
    asFilter: () => null,
    selectedGroups: groupKeys,
    groupCount: groupKeys.size,
  };
}

export function selection(mode: SelectionMode = 'multi'): TablePlugin {
  return {
    name: 'selection',

    init(ctx: TableContext) {
      let anchorRow = -1;
      let anchorCol = -1;

      function setActiveAndSpan(row: number, col: number, span: SelectionSpan | null, additional: SelectionSpan[] = []) {
        const live = ctx.getLatest();
        const r = live.rows[row];
        const c = live.columns[col];
        if (r && c) {
          ctx.setActiveCell({
            rowIndex: row, colIndex: col,
            rowId: getRowId(r, row), field: c.field, value: r[c.field],
          });
        }
        ctx.setSelection(deriveState(span, additional, live));
      }

      // ── Mouse: cell:click ──────────────────────────────
      const unsubCell = ctx.on('cell:click', (payload: unknown) => {
        const { rowIndex, colIndex, ctrlKey, shiftKey } = payload as {
          rowIndex: number; colIndex: number; ctrlKey: boolean; shiftKey: boolean;
          field: string; value: unknown; row: Row;
        };

        const live = ctx.getLatest();
        const row = live.rows[rowIndex];
        if (!row || row.__placeholder === true || row.__group === true) return;

        // Shift+click: extend span from anchor
        if (shiftKey && anchorRow >= 0) {
          const span: SelectionSpan = {
            anchor: { row: anchorRow, col: anchorCol },
            focus: { row: rowIndex, col: colIndex },
          };
          setActiveAndSpan(rowIndex, colIndex, span, live.selection.additionalSpans);
          return;
        }

        // Ctrl+click: add a new span (multi-select)
        if (ctrlKey && mode !== 'single') {
          const newSpan: SelectionSpan = { anchor: { row: rowIndex, col: colIndex }, focus: { row: rowIndex, col: colIndex } };
          const prevSpans = live.selection.span
            ? [live.selection.span, ...live.selection.additionalSpans]
            : [...live.selection.additionalSpans];
          setActiveAndSpan(rowIndex, colIndex, newSpan, prevSpans);
          anchorRow = rowIndex;
          anchorCol = colIndex;
          return;
        }

        // Plain click: single cell
        const span: SelectionSpan = { anchor: { row: rowIndex, col: colIndex }, focus: { row: rowIndex, col: colIndex } };
        setActiveAndSpan(rowIndex, colIndex, span);
        anchorRow = rowIndex;
        anchorCol = colIndex;
      });

      // ── Mouse: group:click ──────────────────────────────
      const unsubGroupClick = ctx.on('group:click', (payload: unknown) => {
        const { rowIndex, colIndex = 0, groupKey, ctrlKey, shiftKey } = payload as {
          rowIndex: number; colIndex?: number; groupKey: Record<string, unknown>;
          ctrlKey: boolean; shiftKey: boolean;
        };

        const live = ctx.getLatest();
        const serialized = serializeGroupKey(groupKey);

        if (ctrlKey && mode !== 'single') {
          // Toggle this group in existing group selection
          const next = new Set(live.selection.selectedGroups);
          if (next.has(serialized)) next.delete(serialized);
          else next.add(serialized);
          ctx.setSelection(deriveGroupState(next));
        } else if (shiftKey && anchorRow >= 0) {
          // Range: select all groups between anchor and this row
          const next = new Set(live.selection.selectedGroups);
          const start = Math.min(anchorRow, rowIndex);
          const end = Math.max(anchorRow, rowIndex);
          for (let r = start; r <= end; r++) {
            const row = live.rows[r];
            if (row && isGroupRow(row)) {
              next.add(serializeGroupKey(row.__groupKey));
            }
          }
          ctx.setSelection(deriveGroupState(next));
        } else {
          // Single group click
          ctx.setSelection(deriveGroupState(new Set([serialized])));
          anchorRow = rowIndex;
          anchorCol = colIndex;
        }

        // Set activeCell so keyboard nav and context menu work
        const col = live.columns[colIndex];
        if (col) {
          ctx.setActiveCell({
            rowIndex, colIndex,
            rowId: serialized, field: col.field,
            value: live.rows[rowIndex]?.[col.field],
          });
        }

        ctx.emit('group:select', { selectedGroups: live.selection.selectedGroups });
      });

      // ── Keyboard ───────────────────────────────────────
      const el = ctx.containerRef.current;
      if (!el) { unsubCell(); unsubGroupClick(); return; }

      const handleKey = (e: KeyboardEvent) => {
        const live = ctx.getLatest();
        const active = live.activeCell;

        // When a cell is being edited, let the editor handle all keys
        if (live.editing?.editingCell) return;

        // Ctrl+A: select all
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
          e.preventDefault();
          const lastRow = live.rows.length - 1;
          const lastCol = live.columns.length - 1;
          if (lastRow < 0 || lastCol < 0) return;
          const span: SelectionSpan = { anchor: { row: 0, col: 0 }, focus: { row: lastRow, col: lastCol } };
          setActiveAndSpan(0, 0, span);
          anchorRow = 0;
          anchorCol = 0;
          return;
        }

        // Escape: clear
        if (e.key === 'Escape') {
          ctx.setSelection(emptySelection());
          ctx.setActiveCell(null);
          anchorRow = -1;
          anchorCol = -1;
          return;
        }

        if (!active) return;

        const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
        if (!isArrow) return;

        e.preventDefault();
        const dr = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
        const dc = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
        const newRow = Math.max(0, Math.min(active.rowIndex + dr, live.rows.length - 1));
        const newCol = Math.max(0, Math.min(active.colIndex + dc, live.columns.length - 1));
        if (newRow === active.rowIndex && newCol === active.colIndex) return;

        if (e.shiftKey) {
          // Extend selection from anchor
          if (anchorRow < 0) { anchorRow = active.rowIndex; anchorCol = active.colIndex; }
          const span: SelectionSpan = { anchor: { row: anchorRow, col: anchorCol }, focus: { row: newRow, col: newCol } };
          setActiveAndSpan(newRow, newCol, span);
        } else {
          // Move single cell selection
          const span: SelectionSpan = { anchor: { row: newRow, col: newCol }, focus: { row: newRow, col: newCol } };
          setActiveAndSpan(newRow, newCol, span);
          anchorRow = newRow;
          anchorCol = newCol;
        }
      };

      el.addEventListener('keydown', handleKey);
      return () => {
        unsubCell();
        unsubGroupClick();
        el.removeEventListener('keydown', handleKey);
      };
    },
  };
}
