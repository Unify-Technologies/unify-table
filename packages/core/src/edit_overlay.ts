import type { QueryEngine, ColumnInfo } from './engine.js';
import type { Row } from './types.js';
import { quoteIdent, toSqlLiteral } from './sql/utils.js';

export interface DirtyRow {
  rowId: unknown;
  state: 'edited' | 'added' | 'deleted';
}

export interface EditOverlay {
  /** The DuckDB overlay TABLE name, e.g. "__utbl_ov_0" */
  readonly overlayTable: string;
  /** The DuckDB VIEW name that merges source + overlay, e.g. "__utbl_ev_0" */
  readonly viewName: string;

  /** Create overlay table + merge view. Must be called before any operations. */
  init(columns: ColumnInfo[], rowIdField: string): Promise<void>;

  /** Apply a cell edit: copy row to overlay if needed, then update the cell. */
  apply(rowId: unknown, field: string, value: unknown): Promise<void>;

  /** Add a new row to the overlay. */
  addRow(data: Row): Promise<void>;

  /** Mark a row as deleted in the overlay. */
  deleteRow(rowId: unknown): Promise<void>;

  /** Restore an added row into the overlay (for undo-delete of an 'added' row). */
  restoreRow(data: Row, state: 'edited' | 'added'): Promise<void>;

  /** Revert a specific row back to source (remove from overlay). */
  revert(rowId: unknown): Promise<void>;

  /** Discard all edits: truncate overlay. */
  revertAll(): Promise<void>;

  /** Get all dirty rows from the overlay. */
  getDirtyRows(): Promise<DirtyRow[]>;

  /** Flush overlay edits into the source table, then clear the overlay. */
  save(): Promise<void>;

  /** Drop overlay table + view (cleanup). */
  destroy(): Promise<void>;
}

/**
 * Create an EditOverlay that maintains a DuckDB overlay table
 * and a merge view combining the source table with the overlay.
 *
 * The source table is never modified (except by explicit `save()`).
 * All edits go to the overlay table. The merge view presents a unified
 * result set that downstream consumers (ViewManager, DataSource) query.
 */
export function createEditOverlay(
  engine: QueryEngine,
  sourceTable: string,
  id: string,
): EditOverlay {
  const overlayTable = `__utbl_ov_${id}`;
  const viewName = `__utbl_ev_${id}`;
  let _columns: ColumnInfo[] = [];
  let _rowIdField = '';

  const qSrc = () => quoteIdent(sourceTable);
  const qOv = () => quoteIdent(overlayTable);
  const qView = () => quoteIdent(viewName);
  const qRowId = () => quoteIdent(_rowIdField);

  /** Column names from the source (excludes __utbl_state). */
  function sourceColList(): string {
    return _columns.map((c) => quoteIdent(c.name)).join(', ');
  }

  /** Rebuild the merge view: source anti-joined with overlay UNION ALL overlay (non-deleted).
   *  ORDER BY rowIdField ensures stable row order after edits. */
  async function rebuildView(): Promise<void> {
    const cols = sourceColList();
    const sql =
      `CREATE OR REPLACE VIEW ${qView()} AS ` +
      `SELECT ${cols} FROM (` +
      `SELECT ${cols} FROM ${qSrc()} ` +
      `WHERE ${qRowId()} NOT IN (SELECT ${qRowId()} FROM ${qOv()}) ` +
      `UNION ALL ` +
      `SELECT ${cols} FROM ${qOv()} WHERE "__utbl_state" != 'deleted'` +
      `) ORDER BY ${qRowId()}`;
    await engine.execute(sql);
  }

  return {
    get overlayTable() {
      return overlayTable;
    },
    get viewName() {
      return viewName;
    },

    async init(columns, rowIdField) {
      _columns = columns;
      _rowIdField = rowIdField;

      // Create overlay table with same schema as source (empty)
      await engine.execute(
        `CREATE TABLE IF NOT EXISTS ${qOv()} AS SELECT * FROM ${qSrc()} WHERE false`,
      );
      // Add state column
      await engine.execute(
        `ALTER TABLE ${qOv()} ADD COLUMN IF NOT EXISTS "__utbl_state" VARCHAR DEFAULT 'edited'`,
      );
      await rebuildView();
    },

    async apply(rowId, field, value) {
      // Copy row from source to overlay if not already there
      const existing = await engine.query<{ cnt: number }>(
        `SELECT COUNT(*) AS cnt FROM ${qOv()} WHERE ${qRowId()} = ${toSqlLiteral(rowId)}`,
      );
      if (Number(existing[0]?.cnt) === 0) {
        await engine.execute(
          `INSERT INTO ${qOv()} SELECT *, 'edited' AS "__utbl_state" FROM ${qSrc()} WHERE ${qRowId()} = ${toSqlLiteral(rowId)}`,
        );
      }
      // Update the specific cell
      await engine.execute(
        `UPDATE ${qOv()} SET ${quoteIdent(field)} = ${toSqlLiteral(value)} WHERE ${qRowId()} = ${toSqlLiteral(rowId)}`,
      );
    },

    async addRow(data) {
      const fields = Object.keys(data);
      const cols = [...fields.map(quoteIdent), '"__utbl_state"'].join(', ');
      const vals = [...fields.map((f) => toSqlLiteral(data[f])), "'added'"].join(', ');
      await engine.execute(`INSERT INTO ${qOv()} (${cols}) VALUES (${vals})`);
    },

    async deleteRow(rowId) {
      // Check if row is already in overlay
      const existing = await engine.query<{ state: string }>(
        `SELECT "__utbl_state" AS state FROM ${qOv()} WHERE ${qRowId()} = ${toSqlLiteral(rowId)}`,
      );

      if (existing.length > 0) {
        if (existing[0].state === 'added') {
          // Row was added in this session -- truly remove it
          await engine.execute(
            `DELETE FROM ${qOv()} WHERE ${qRowId()} = ${toSqlLiteral(rowId)}`,
          );
        } else {
          // Row was edited -- mark as deleted
          await engine.execute(
            `UPDATE ${qOv()} SET "__utbl_state" = 'deleted' WHERE ${qRowId()} = ${toSqlLiteral(rowId)}`,
          );
        }
      } else {
        // Source row not in overlay -- insert as deleted
        await engine.execute(
          `INSERT INTO ${qOv()} (${qRowId()}, "__utbl_state") VALUES (${toSqlLiteral(rowId)}, 'deleted')`,
        );
      }
    },

    async restoreRow(data, state) {
      const fields = Object.keys(data);
      const cols = [...fields.map(quoteIdent), '"__utbl_state"'].join(', ');
      const vals = [...fields.map((f) => toSqlLiteral(data[f])), toSqlLiteral(state)].join(', ');
      await engine.execute(`INSERT INTO ${qOv()} (${cols}) VALUES (${vals})`);
    },

    async revert(rowId) {
      await engine.execute(
        `DELETE FROM ${qOv()} WHERE ${qRowId()} = ${toSqlLiteral(rowId)}`,
      );
    },

    async revertAll() {
      await engine.execute(`DELETE FROM ${qOv()}`);
    },

    async getDirtyRows() {
      const rows = await engine.query<{ rowId: unknown; state: string }>(
        `SELECT ${qRowId()} AS "rowId", "__utbl_state" AS state FROM ${qOv()}`,
      );
      return rows.map((r) => ({
        rowId: r.rowId,
        state: r.state as DirtyRow['state'],
      }));
    },

    async save() {
      const cols = sourceColList();
      const setClauses = _columns
        .filter((c) => c.name !== _rowIdField)
        .map((c) => `${quoteIdent(c.name)} = __ov.${quoteIdent(c.name)}`)
        .join(', ');

      // Apply edits: overwrite source rows with overlay versions
      await engine.execute(
        `UPDATE ${qSrc()} SET ${setClauses} FROM ${qOv()} AS __ov ` +
        `WHERE ${qSrc()}.${qRowId()} = __ov.${qRowId()} AND __ov."__utbl_state" = 'edited'`,
      );
      // Apply adds: insert new rows into source
      await engine.execute(
        `INSERT INTO ${qSrc()} (${cols}) SELECT ${cols} FROM ${qOv()} WHERE "__utbl_state" = 'added'`,
      );
      // Apply deletes: remove from source
      await engine.execute(
        `DELETE FROM ${qSrc()} WHERE ${qRowId()} IN (SELECT ${qRowId()} FROM ${qOv()} WHERE "__utbl_state" = 'deleted')`,
      );
      // Clear overlay
      await engine.execute(`DELETE FROM ${qOv()}`);
    },

    async destroy() {
      await engine.execute(`DROP VIEW IF EXISTS ${qView()}`);
      await engine.execute(`DROP TABLE IF EXISTS ${qOv()}`);
    },
  };
}
