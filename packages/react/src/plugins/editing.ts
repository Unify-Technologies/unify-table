import { createEditOverlay } from "@unify/table-core";
import type { EditOverlay } from "@unify/table-core";
import type {
  TablePlugin,
  TableContext,
  CellRef,
  EditBackend,
  EditingState,
} from "../types.js";
import { detectIdColumnByName } from "../utils.js";

export interface EditingOptions {
  /** Whether editing is initially enabled. Default: true. */
  enabled?: boolean;
  /** Maximum undo stack depth. Default: 50. */
  undoDepth?: number;
}

type EditOp =
  | { type: "edit"; rowId: string; field: string; oldValue: unknown; newValue: unknown }
  | { type: "batch"; ops: EditOp[] };

let overlayIdCounter = 0;

export function editing(options: EditingOptions = {}): TablePlugin {
  const { enabled: initialEnabled = true, undoDepth = 50 } = options;

  return {
    name: "editing",

    init(ctx: TableContext) {
      let overlay: EditOverlay | null = null;
      let initialized = false;
      let enabled = initialEnabled;
      let rowIdField = "";
      let editingCell: CellRef | null = null;

      const undoStack: EditOp[] = [];
      const redoStack: EditOp[] = [];
      // Track which cells are dirty: rowId -> Set<field>
      const dirtyMap = new Map<
        string,
        { state: "edited"; fields: Set<string> }
      >();

      // Batch editing — suppress individual refresh/undo during batch
      let _batching = false;
      let _batchOps: EditOp[] = [];

      const id = String(overlayIdCounter++);

      function refocusContainer() {
        ctx.getLatest().containerRef.current?.focus();
      }

      function publishState() {
        const state: EditingState = {
          editingCell,
          startEditing(cell: CellRef) {
            editingCell = cell;
            ctx.getLatest().emit("edit:start", cell);
            publishState();
          },
          async commitEdit(cell: CellRef, value: unknown) {
            await backend.commitEdit(cell, value);
            editingCell = null;
            refocusContainer();
            publishState();
          },
          cancelEdit() {
            editingCell = null;
            refocusContainer();
            ctx.getLatest().emit("edit:cancel");
            publishState();
          },
          async undo() {
            await backend.undo();
            publishState();
          },
          async redo() {
            await backend.redo();
            publishState();
          },
          canUndo: undoStack.length > 0,
          canRedo: redoStack.length > 0,
        };
        ctx.getLatest()._setEditing(state);
      }

      async function ensureInit(): Promise<EditOverlay> {
        if (overlay && initialized) return overlay;

        overlay = createEditOverlay(ctx.getLatest().engine, ctx.getLatest().table, id);

        // Detect rowIdField
        const cols = await ctx.getLatest().engine.columns(ctx.getLatest().table);
        rowIdField = detectIdColumnByName(cols) || cols[0]?.name || "";

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

      function markDirty(rowId: string, field: string) {
        const existing = dirtyMap.get(rowId);
        if (existing) {
          existing.fields.add(field);
        } else {
          dirtyMap.set(rowId, { state: "edited", fields: new Set([field]) });
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
              l.emit("edit:invalid", { cell, value, error: result });
              return;
            }
          }

          const ov = await ensureInit();
          const oldValue = cell.value;

          await ov.apply(cell.rowId, cell.field, value);
          const op: EditOp = {
            type: "edit",
            rowId: cell.rowId,
            field: cell.field,
            oldValue,
            newValue: value,
          };
          if (_batching) {
            _batchOps.push(op);
          } else {
            pushUndo(op);
          }
          markDirty(cell.rowId, cell.field);

          l.emit("edit:commit", { cell, value });
          if (!_batching) await l.refresh();
        },

        async undo() {
          const op = undoStack.pop();
          if (!op || !overlay) return;
          const l = ctx.getLatest();

          async function undoSingle(sop: EditOp): Promise<void> {
            if (sop.type === "edit") {
              await overlay!.apply(sop.rowId, sop.field, sop.oldValue);
              const dirty = dirtyMap.get(sop.rowId);
              if (dirty) {
                dirty.fields.delete(sop.field);
                if (dirty.fields.size === 0 && dirty.state === "edited") {
                  await overlay!.revert(sop.rowId);
                  dirtyMap.delete(sop.rowId);
                }
              }
            } else if (sop.type === "batch") {
              for (const sub of [...sop.ops].reverse()) await undoSingle(sub);
            }
          }

          await undoSingle(op);

          redoStack.push(op);
          await l.refresh();
        },

        async redo() {
          const op = redoStack.pop();
          if (!op || !overlay) return;
          const l = ctx.getLatest();

          async function redoSingle(sop: EditOp): Promise<void> {
            if (sop.type === "edit") {
              await overlay!.apply(sop.rowId, sop.field, sop.newValue);
              markDirty(sop.rowId, sop.field);
            } else if (sop.type === "batch") {
              for (const sub of sop.ops) await redoSingle(sub);
            }
          }

          await redoSingle(op);
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

      // Publish initial editing state
      publishState();

      // Listen for toggle events
      const offToggle = ctx.on("editing:toggle", () => {
        enabled = !enabled;
      });

      // Listen for save events
      const offSave = ctx.on("editing:save", async () => {
        if (!overlay) return;
        await overlay.save();
        undoStack.length = 0;
        redoStack.length = 0;
        dirtyMap.clear();
        await ctx.getLatest().refresh();
        publishState();
      });

      // Listen for batch start/end events (used by fillHandle plugin)
      const offBatchStart = ctx.on("editing:batchStart", () => {
        _batching = true;
        _batchOps = [];
      });
      const offBatchEnd = ctx.on("editing:batchEnd", async () => {
        _batching = false;
        if (_batchOps.length > 0) {
          pushUndo({ type: "batch", ops: _batchOps });
          _batchOps = [];
        }
        await ctx.getLatest().refresh();
        publishState();
      });

      // Listen for discard events
      const offDiscard = ctx.on("editing:discard", async () => {
        if (!overlay) return;
        await overlay.revertAll();
        undoStack.length = 0;
        redoStack.length = 0;
        dirtyMap.clear();
        await ctx.getLatest().refresh();
        publishState();
      });

      // Cleanup
      return () => {
        offToggle();
        offSave();
        offDiscard();
        offBatchStart();
        offBatchEnd();
        ctx.getLatest()._setEditing(null);
        if (overlay) {
          ctx.getLatest().viewManager.setBaseTable(ctx.getLatest().table);
          overlay.destroy().catch(() => {});
        }
      };
    },

  };
}
