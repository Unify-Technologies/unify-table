import type { TablePlugin, TableContext, CellRef } from "../types.js";
import { ID_CANDIDATES } from "../utils.js";
import { isGroupRow, serializeGroupKey } from "./row_grouping.js";

export function clipboard(): TablePlugin {
  return {
    name: "clipboard",
    dependencies: ["selection"],
    shortcuts: {
      "ctrl+c": (ctx) => copySelection(ctx),
      "ctrl+v": (ctx) => pasteFromClipboard(ctx),
    },
  };
}

/** Parse a TSV string into a 2D array of strings. */
export function parseTSV(text: string): string[][] {
  return text
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => line.split("\t"));
}

/** Detect whether the first row of parsed TSV matches column fields. */
export function detectHeaderRow(parsed: string[][], columns: { field: string }[]): boolean {
  if (parsed.length < 2) return false;
  const firstRow = parsed[0];
  const fields = new Set(columns.map((c) => c.field));
  const matchCount = firstRow.filter((cell) => fields.has(cell)).length;
  return matchCount >= firstRow.length * 0.5;
}

async function copySelection(ctx: TableContext) {
  const { selection, rows, columns } = ctx.getLatest();

  let selectedRows: Record<string, unknown>[];

  if (selection.selectedCells.length > 0) {
    // Copy only selected cells — group by row, include only selected columns
    const cellsByRow = new Map<number, Set<string>>();
    for (const cell of selection.selectedCells) {
      if (!cellsByRow.has(cell.rowIndex)) cellsByRow.set(cell.rowIndex, new Set());
      cellsByRow.get(cell.rowIndex)!.add(cell.field);
    }
    const selectedFields = [...new Set(selection.selectedCells.map((c) => c.field))];
    const cols = columns.filter((c) => selectedFields.includes(c.field));
    const headers = cols.map((c) => c.field).join("\t");
    const body = [...cellsByRow.entries()]
      .sort(([a], [b]) => a - b)
      .map(([rowIdx, fields]) => {
        const row = rows[rowIdx];
        if (!row) return "";
        return cols.map((c) => (fields.has(c.field) ? (row[c.field] ?? "") : "")).join("\t");
      })
      .join("\n");
    await navigator.clipboard.writeText(`${headers}\n${body}`);
    return;
  }

  if (selection.groupCount > 0) {
    await copyGroupData(ctx);
    return;
  }

  if (selection.selectedIds.size > 0) {
    // Copy rows matching selected IDs
    selectedRows = rows.filter((row) => {
      if (!row) return false;
      for (const key of ID_CANDIDATES) {
        if (row[key] !== undefined && selection.selectedIds.has(String(row[key]))) return true;
      }
      return false;
    });
  } else {
    // No selection — copy all loaded (non-placeholder) rows
    selectedRows = rows.filter((row) => row && row.__placeholder !== true);
  }

  if (selectedRows.length === 0) return;

  const headers = columns.map((c) => c.field).join("\t");
  const body = selectedRows
    .map((row) => columns.map((c) => row[c.field] ?? "").join("\t"))
    .join("\n");

  await navigator.clipboard.writeText(`${headers}\n${body}`);
}

/** Copy data rows for all selected groups to clipboard as TSV. */
export async function copyGroupData(ctx: TableContext) {
  const { selection, rows, columns, datasource, groupBy } = ctx.getLatest();
  if (selection.groupCount === 0) return;

  const allDataRows: Record<string, unknown>[] = [];
  const maxDepth = groupBy.length - 1;

  for (const serialized of selection.selectedGroups) {
    // Find the group row in the visible rows array
    const groupIdx = rows.findIndex(
      (r) => r && isGroupRow(r) && serializeGroupKey(r.__groupKey) === serialized,
    );

    if (groupIdx < 0) continue;
    const groupRow = rows[groupIdx];
    const expanded = groupRow.__expanded === true;
    const depth = (groupRow.__depth as number) ?? 0;

    if (expanded && depth === maxDepth) {
      // Expanded leaf group — collect visible data rows after the group header
      for (let i = groupIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r) continue;
        if (isGroupRow(r)) {
          // Stop at same-or-lesser depth group
          if ((r.__depth as number) <= depth) break;
          continue;
        }
        if (r.__placeholder === true) continue;
        allDataRows.push(r);
      }
    } else {
      // Collapsed or non-leaf group — fetch all leaf rows via datasource
      const groupKey = groupRow.__groupKey as Record<string, unknown>;
      const page = await datasource.fetchGroupDetail(groupKey, { offset: 0, limit: 10000 });
      allDataRows.push(...page.rows);
    }
  }

  if (allDataRows.length === 0) return;

  const headers = columns.map((c) => c.field).join("\t");
  const body = allDataRows
    .map((row) => columns.map((c) => row[c.field] ?? "").join("\t"))
    .join("\n");

  await navigator.clipboard.writeText(`${headers}\n${body}`);
}

async function pasteFromClipboard(ctx: TableContext) {
  const live = ctx.getLatest();
  const text = await navigator.clipboard.readText();
  if (!text.trim()) return;

  const parsed = parseTSV(text);
  if (parsed.length === 0) return;

  const hasHeader = detectHeaderRow(parsed, live.columns);
  const dataRows = hasHeader ? parsed.slice(1) : parsed;
  const headerFields = hasHeader
    ? parsed[0]
    : live.activeCell
      ? live.columns.slice(live.activeCell.colIndex).map((c) => c.field)
      : live.columns.map((c) => c.field);

  if (live.activeCell) {
    // Paste over existing rows starting at activeCell position
    const startRowIndex = live.activeCell.rowIndex;
    for (let r = 0; r < dataRows.length; r++) {
      const rowIndex = startRowIndex + r;
      const row = live.rows[rowIndex];
      if (!row || row.__placeholder === true) continue;

      for (let c = 0; c < dataRows[r].length && c < headerFields.length; c++) {
        const field = headerFields[c];
        const col = live.columns.find((col) => col.field === field);
        if (!col || col.editable === false) continue;

        const cell: CellRef = {
          rowIndex,
          colIndex: live.columns.indexOf(col),
          rowId: String(row.id ?? row.ID ?? row._id ?? rowIndex),
          field,
          value: row[field],
        };
        await live.editing?.commitEdit(cell, dataRows[r][c]);
      }
    }
  }
}
