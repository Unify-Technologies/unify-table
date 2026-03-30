import type { TablePlugin, TableContext, CellRef } from '../types.js';

interface EditingOptions {
  commitOn?: 'blur' | 'enter' | 'both';
  undoDepth?: number;
}

export function editing(options: EditingOptions = {}): TablePlugin {
  return {
    name: 'editing',
    init(ctx: TableContext) {
      // Wrap commitEdit to enforce column validation
      const originalCommit = ctx.commitEdit.bind(ctx);
      ctx.commitEdit = async (cell: CellRef, value: unknown) => {
        const column = ctx.columns.find((c) => c.field === cell.field);
        if (column?.validate) {
          const result = column.validate(value);
          if (result !== true) {
            ctx.emit('edit:invalid', { cell, value, error: result });
            return;
          }
        }
        await originalCommit(cell, value);
      };
    },
  };
}
