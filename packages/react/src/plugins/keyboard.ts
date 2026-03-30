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
        if (ctx.editingCell) {
          // Commit would be handled by the editing cell component
        } else if (ctx.activeCell) {
          ctx.startEditing(ctx.activeCell);
        }
      },
      Escape: (ctx) => {
        if (ctx.editingCell) {
          ctx.cancelEdit();
        } else {
          ctx.setActiveCell(null);
        }
      },
      F2: (ctx) => {
        if (ctx.activeCell && !ctx.editingCell) {
          ctx.startEditing(ctx.activeCell);
        }
      },
    },
    init(ctx: TableContext) {
      const el = ctx.containerRef.current;
      if (!el) return;

      const shortcuts = plugin.shortcuts!;
      const handler = (e: KeyboardEvent) => {
        const shortcut = shortcuts[e.key];
        if (shortcut) {
          e.preventDefault();
          shortcut(ctx.getLatest());
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
