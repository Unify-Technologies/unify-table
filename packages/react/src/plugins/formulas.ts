import type { TablePlugin, TableContext, ResolvedColumn, FormulasState } from "../types.js";

export interface FormulaColumnDef {
  name: string;
  expression: string;
  /** Display label. Defaults to name. */
  label?: string;
  /** Column width. Default: 150. */
  width?: number;
  /** Column alignment. Default: inferred or 'left'. */
  align?: "left" | "center" | "right";
  /** Number format applied to the computed value. */
  format?: string;
  /** Allow users to edit this formula's expression at runtime. Default: false. */
  editable?: boolean;
}

export interface FormulasConfig {
  columns: FormulaColumnDef[];
}

interface FormulaOp {
  name: string;
  oldExpression: string;
  newExpression: string;
}

export function formulas(config: FormulasConfig): TablePlugin {
  const formulaColumns = config.columns.map((c) => ({ ...c }));

  return {
    name: "formulas",

    transformColumns(columns: ResolvedColumn[]): ResolvedColumn[] {
      return [
        ...columns,
        ...formulaColumns.map((fc) => ({
          field: fc.name,
          label: fc.label ?? fc.name,
          sortable: true,
          filterable: true,
          resizable: true,
          editable: (fc.editable ?? false) as boolean,
          currentWidth: fc.width ?? 150,
          align: fc.align,
          format: fc.format,
          _isFormula: true,
          _formulaExpression: fc.expression,
        })),
      ];
    },

    init(ctx: TableContext) {
      const undoStack: FormulaOp[] = [];
      const redoStack: FormulaOp[] = [];

      function syncExpressions() {
        ctx
          .getLatest()
          .viewManager.setSelectExpressions(
            formulaColumns.map((fc) => ({ expression: fc.expression, alias: fc.name })),
          );
      }

      async function applyExpression(name: string, expression: string) {
        const fc = formulaColumns.find((c) => c.name === name);
        if (!fc) return;
        fc.expression = expression;
        syncExpressions();
        const ds = ctx.getLatest().datasource;
        await ctx.getLatest().viewManager.sync(
          ds.filters,
          ds.sort.map((s) => ({ field: s.field, dir: s.dir })),
        );
        await ctx.getLatest().refresh();
      }

      function publishState() {
        const state: FormulasState = {
          getExpression(name: string) {
            return formulaColumns.find((fc) => fc.name === name)?.expression;
          },

          async updateExpression(name: string, expression: string) {
            const fc = formulaColumns.find((c) => c.name === name);
            if (!fc) return;

            const oldExpr = fc.expression;

            try {
              await applyExpression(name, expression);
              undoStack.push({ name, oldExpression: oldExpr, newExpression: expression });
              redoStack.length = 0;
              publishState();
            } catch (err) {
              // Rollback on invalid expression
              await applyExpression(name, oldExpr).catch(() => {});
              throw err;
            }
          },

          async undo() {
            const op = undoStack.pop();
            if (!op) return;
            await applyExpression(op.name, op.oldExpression);
            redoStack.push(op);
            publishState();
          },

          async redo() {
            const op = redoStack.pop();
            if (!op) return;
            await applyExpression(op.name, op.newExpression);
            undoStack.push(op);
            publishState();
          },

          canUndo: undoStack.length > 0,
          canRedo: redoStack.length > 0,
        };
        ctx.getLatest()._setFormulas(state);
      }

      // Push formula expressions into the ViewManager SELECT clause
      syncExpressions();

      // Trigger a sync so the view includes formula columns immediately
      const ds = ctx.getLatest().datasource;
      ctx.viewManager
        .sync(
          ds.filters,
          ds.sort.map((s) => ({ field: s.field, dir: s.dir })),
        )
        .then(() => ctx.getLatest().refresh());

      publishState();

      return () => {
        ctx.getLatest()._setFormulas(null);
        ctx.getLatest().viewManager.setSelectExpressions([]);
      };
    },
  };
}
