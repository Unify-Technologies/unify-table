import { createEditOverlay } from '@unify/table-core';
import type { EditOverlay, Row } from '@unify/table-core';
import type { TablePlugin, TableContext, CellRef, EditBackend, MenuItem } from '../types.js';

export interface EditingOptions {
  /** Whether editing is initially enabled. Default: true. */
  enabled?: boolean;
  /** Maximum undo stack depth. Default: 50. */
  undoDepth?: number;
}

type EditOp =
  | { type: 'edit'; rowId: string; field: string; oldValue: unknown; newValue: unknown }
  | { type: 'add'; rowId: string; data: Row }
  | { type: 'delete'; rowIds: string[]; snapshots: Array<{ rowId: string; data: Row; state: 'edited' | 'added' }> };

let overlayIdCounter = 0;

export function editing(options: EditingOptions = {}): TablePlugin {
  const { enabled: initialEnabled = true, undoDepth = 50 } = options;

  return {
    name: 'editing',

    init(ctx: TableContext) {
      let overlay: EditOverlay | null = null;
      let initialized = false;
      let enabled = initialEnabled;
      let rowIdField = '';

      const undoStack: EditOp[] = [];
      const redoStack: EditOp[] = [];
      // Track which cells are dirty: rowId -> Set<field>
      const dirtyMap = new Map<string, { state: 'edited' | 'added' | 'deleted'; fields: Set<string> }>();

      const id = String(overlayIdCounter++);

      async function ensureInit(): Promise<EditOverlay> {
        if (overlay && initialized) return overlay;

        overlay = createEditOverlay(ctx.getLatest().engine, ctx.getLatest().table, id);

        // Detect rowIdField
        const cols = await ctx.getLatest().engine.columns(ctx.getLatest().table);
        // Use the same detection logic as useTableContext
        const candidates = ['id', 'ID', '_id', 'rowid', '__table_rid'];
        for (const c of candidates) {
          if (cols.some((col) => col.name === c)) {
            rowIdField = c;
            break;
          }
        }
        if (!rowIdField && cols.length > 0) {
          rowIdField = cols[0].name;
        }

        await overlay.init(cols, rowIdField);

        // Redirect the ViewManager to use the overlay view as base
        ctx.getLatest().viewManager.setBaseTable(overlay.viewName);
        // Re-sync so filters/sort now operate on the overlay view
        const ds = ctx.getLatest().datasource;
        await ctx.getLatest().viewManager.sync(
          ds.filters,
          ds.sort.map((s) => ({ field: s.field, dir: s.dir })),
        );
        initialized = true;
        return overlay;
      }

      function pushUndo(op: EditOp) {
        undoStack.push(op);
        if (undoStack.length > undoDepth) undoStack.shift();
        redoStack.length = 0;
      }

      function updateDirtyMap(rowId: string, state: 'edited' | 'added' | 'deleted', field?: string) {
        const existing = dirtyMap.get(rowId);
        if (state === 'deleted' || (state === 'edited' && !field)) {
          dirtyMap.set(rowId, { state, fields: existing?.fields ?? new Set() });
        } else if (existing) {
          existing.state = state;
          if (field) existing.fields.add(field);
        } else {
          dirtyMap.set(rowId, { state, fields: field ? new Set([field]) : new Set() });
        }
      }

      const backend: EditBackend = {
        async commitEdit(cell: CellRef, value: unknown) {
          if (!enabled) return;

          // Column validation
          const l = ctx.getLatest();
          const column = l.columns.find((c) => c.field === cell.field);
          if (column?.editable === false) return;
          if (column?.validate) {
            const result = column.validate(value);
            if (result !== true) {
              l.emit('edit:invalid', { cell, value, error: result });
              return;
            }
          }

          const ov = await ensureInit();
          const oldValue = cell.value;

          await ov.apply(cell.rowId, cell.field, value);
          pushUndo({ type: 'edit', rowId: cell.rowId, field: cell.field, oldValue, newValue: value });
          updateDirtyMap(cell.rowId, dirtyMap.get(cell.rowId)?.state ?? 'edited', cell.field);

          l.emit('edit:commit', { cell, value });
          await l.refresh();
        },

        async addRow(data: Row) {
          if (!enabled) return;

          const ov = await ensureInit();
          const l = ctx.getLatest();

          await ov.addRow(data);
          const rowId = String(data[rowIdField] ?? '');
          pushUndo({ type: 'add', rowId, data });
          updateDirtyMap(rowId, 'added');

          l.emit('row:add', data);
          await l.refresh();
        },

        async deleteRows(ids: string[]) {
          if (!enabled || ids.length === 0) return;

          const ov = await ensureInit();
          const l = ctx.getLatest();

          // Snapshot rows before deleting (for undo)
          const snapshots: Array<{ rowId: string; data: Row; state: 'edited' | 'added' }> = [];
          for (const rid of ids) {
            const existing = dirtyMap.get(rid);
            const currentRows = l.rows.filter((r) => String(r[rowIdField]) === rid);
            const rowData = currentRows[0] ?? {};
            snapshots.push({
              rowId: rid,
              data: rowData,
              state: existing?.state === 'added' ? 'added' : 'edited',
            });
            await ov.deleteRow(rid);
            if (existing?.state === 'added') {
              dirtyMap.delete(rid);
            } else {
              updateDirtyMap(rid, 'deleted');
            }
          }
          pushUndo({ type: 'delete', rowIds: ids, snapshots });

          l.emit('row:delete', ids);
          await l.refresh();
        },

        async undo() {
          const op = undoStack.pop();
          if (!op || !overlay) return;
          const l = ctx.getLatest();

          if (op.type === 'edit') {
            await overlay.apply(op.rowId, op.field, op.oldValue);
            // Check if the row is now identical to source — if so, fully revert
            const dirty = dirtyMap.get(op.rowId);
            if (dirty) {
              dirty.fields.delete(op.field);
              if (dirty.fields.size === 0 && dirty.state === 'edited') {
                await overlay.revert(op.rowId);
                dirtyMap.delete(op.rowId);
              }
            }
          } else if (op.type === 'add') {
            await overlay.deleteRow(op.rowId);
            dirtyMap.delete(op.rowId);
          } else if (op.type === 'delete') {
            for (const snap of op.snapshots) {
              if (snap.state === 'added') {
                await overlay.restoreRow(snap.data, 'added');
                updateDirtyMap(snap.rowId, 'added');
              } else {
                // Was an edited or original row — revert the delete
                await overlay.revert(snap.rowId);
                dirtyMap.delete(snap.rowId);
                // If it was edited before deletion, re-apply edits
                // For simplicity, restore the snapshot
                const hasNonIdFields = Object.keys(snap.data).some((k) => k !== rowIdField);
                if (hasNonIdFields) {
                  await overlay.restoreRow(snap.data, 'edited');
                  updateDirtyMap(snap.rowId, 'edited');
                }
              }
            }
          }

          redoStack.push(op);
          await l.refresh();
        },

        async redo() {
          const op = redoStack.pop();
          if (!op || !overlay) return;
          const l = ctx.getLatest();

          if (op.type === 'edit') {
            await overlay.apply(op.rowId, op.field, op.newValue);
            updateDirtyMap(op.rowId, dirtyMap.get(op.rowId)?.state ?? 'edited', op.field);
          } else if (op.type === 'add') {
            await overlay.addRow(op.data);
            updateDirtyMap(op.rowId, 'added');
          } else if (op.type === 'delete') {
            for (const rid of op.rowIds) {
              await overlay.deleteRow(rid);
              const snap = op.snapshots.find((s) => s.rowId === rid);
              if (snap?.state === 'added') {
                dirtyMap.delete(rid);
              } else {
                updateDirtyMap(rid, 'deleted');
              }
            }
          }

          undoStack.push(op);
          await l.refresh();
        },

        canUndo() {
          return undoStack.length > 0;
        },

        canRedo() {
          return redoStack.length > 0;
        },
      };

      // Register the edit backend
      ctx.setEditBackend(backend);

      // Listen for toggle events
      const offToggle = ctx.on('editing:toggle', () => {
        enabled = !enabled;
      });

      // Listen for save events
      const offSave = ctx.on('editing:save', async () => {
        if (!overlay) return;
        await overlay.save();
        undoStack.length = 0;
        redoStack.length = 0;
        dirtyMap.clear();
        await ctx.getLatest().refresh();
      });

      // Listen for discard events
      const offDiscard = ctx.on('editing:discard', async () => {
        if (!overlay) return;
        await overlay.revertAll();
        undoStack.length = 0;
        redoStack.length = 0;
        dirtyMap.clear();
        await ctx.getLatest().refresh();
      });

      // Cleanup
      return () => {
        offToggle();
        offSave();
        offDiscard();
        ctx.getLatest().setEditBackend(null);
        if (overlay) {
          ctx.getLatest().viewManager.setBaseTable(ctx.getLatest().table);
          overlay.destroy().catch(() => {});
        }
      };
    },

    transformRows(rows: Row[]) {
      // Dirty state annotation is done via the dirtyMap inside init.
      // Since transformRows doesn't have access to the closure, we use
      // a row-level marker set during data fetch. For now, pass through.
      return rows;
    },

    contextMenuItems(ctx: TableContext, cell: CellRef): MenuItem[] {
      const items: MenuItem[] = [];
      items.push({ label: '', action: () => {}, type: 'separator' });
      items.push({
        label: 'Delete row',
        action: () => ctx.deleteRows([cell.rowId]),
        danger: true,
      });
      return items;
    },
  };
}
