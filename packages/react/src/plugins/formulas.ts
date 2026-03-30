import type { TablePlugin, TableContext, ResolvedColumn } from '../types.js';
import { quoteIdent } from '@unify/table-core';

interface FormulaColumn {
  name: string;
  expression: string;
}

const formulaColumns: FormulaColumn[] = [];

export function formulas(): TablePlugin {
  return {
    name: 'formulas',

    transformColumns(columns: ResolvedColumn[]): ResolvedColumn[] {
      // Append computed columns
      return [
        ...columns,
        ...formulaColumns.map((fc) => ({
          field: fc.name,
          label: fc.name,
          sortable: true,
          filterable: true,
          resizable: true,
          currentWidth: 150,
        })),
      ];
    },

    init(ctx: TableContext) {
      // Formula columns are managed via addColumn/removeColumn
    },
  };
}

/** Add a computed column (backed by DuckDB expression). */
export function addFormulaColumn(name: string, expression: string): void {
  formulaColumns.push({ name, expression });
}

/** Remove a computed column. */
export function removeFormulaColumn(name: string): void {
  const idx = formulaColumns.findIndex((fc) => fc.name === name);
  if (idx !== -1) formulaColumns.splice(idx, 1);
}

/** Get the SQL for a view including formula columns. */
export function formulaViewSql(table: string): string {
  if (formulaColumns.length === 0) return `SELECT * FROM ${quoteIdent(table)}`;
  const extras = formulaColumns.map((fc) => `(${fc.expression}) AS ${quoteIdent(fc.name)}`).join(', ');
  return `SELECT *, ${extras} FROM ${quoteIdent(table)}`;
}
