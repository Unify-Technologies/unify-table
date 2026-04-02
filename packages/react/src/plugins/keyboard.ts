import type { TablePlugin, TableContext } from '../types.js';
import { getRowId } from '../utils.js';

export function keyboard(): TablePlugin {
  const plugin: TablePlugin = {
    name: 'keyboard',
    dependencies: [],
    shortcuts: {
      ArrowUp: (ctx) => moveActiveCell(ctx, 0, -1),
      ArrowDown: (ctx) => moveActiveCell(ctx, 0, 1),
      ArrowLeft: (ctx) => moveActiveCell(ctx, -1, 0),
      ArrowRight: (ctx) => moveActiveCell(ctx, 1, 0),
      Tab: (ctx) => moveActiveCell(ctx, 1, 0),
      Enter: (ctx) => {
        if (ctx.editing?.editingCell) {
          // Commit would be handled by the editing cell component
        } else if (ctx.activeCell && ctx.editing) {
          ctx.editing.startEditing(ctx.activeCell);
        }
      },
      Escape: (ctx) => {
        if (ctx.editing?.editingCell) {
          ctx.editing.cancelEdit();
        } else {
          ctx.setActiveCell(null);
        }
      },
      F2: (ctx) => {
        if (ctx.activeCell && !ctx.editing?.editingCell && ctx.editing) {
          ctx.editing.startEditing(ctx.activeCell);
        }
      },
    },
    init(ctx: TableContext) {
      const el = ctx.containerRef.current;
      if (!el) return;

      const shortcuts = plugin.shortcuts!;
      const hasSelectionPlugin = !!ctx.getLatest().getPlugin('selection');

      const handler = (e: KeyboardEvent) => {
        const latest = ctx.getLatest();

        // When a cell is being edited, let the editor handle all keys
        // except Escape (cancel) and Enter (commit, handled by editor's onKeyDown)
        if (latest.editing?.editingCell) {
          if (e.key === 'Escape') {
            e.preventDefault();
            latest.editing.cancelEdit();
          }
          // All other keys pass through to the inline editor
          return;
        }

        // Arrow keys are handled by the selection plugin when present
        // to avoid double-movement
        const isArrow = e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight';
        if (isArrow && hasSelectionPlugin) return;

        const shortcut = shortcuts[e.key];
        if (shortcut) {
          e.preventDefault();
          shortcut(latest);
        }
      };

      el.addEventListener('keydown', handler);
      return () => el.removeEventListener('keydown', handler);
    },
  };
  return plugin;
}

function moveActiveCell(ctx: TableContext, dx: number, dy: number) {
  const { activeCell, columns, rows } = ctx;
  if (!activeCell) {
    if (rows.length > 0 && columns.length > 0) {
      ctx.setActiveCell({
        rowIndex: 0,
        colIndex: 0,
        rowId: '',
        field: columns[0].field,
        value: rows[0][columns[0].field],
      });
    }
    return;
  }

  const newCol = Math.max(0, Math.min(columns.length - 1, activeCell.colIndex + dx));
  const newRow = Math.max(0, Math.min(rows.length - 1, activeCell.rowIndex + dy));
  const row = rows[newRow];
  const col = columns[newCol];

  if (row && col) {
    ctx.setActiveCell({
      rowIndex: newRow,
      colIndex: newCol,
      rowId: getRowId(row, newRow),
      field: col.field,
      value: row[col.field],
    });
  }
}
