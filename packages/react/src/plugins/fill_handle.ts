import { createElement, useCallback, useEffect, useRef, useState } from "react";
import type { TablePlugin, TableContext, CellRef, MenuItem } from "../types.js";
import { getRowId, MENU_SEPARATOR } from "../utils.js";

// ─── Pattern Detection ──────────────────────────────────────

/** Detect and extrapolate a pattern from a sequence of values. */
export function detectPattern(values: unknown[]): (index: number) => unknown {
  if (values.length === 0) return () => null;
  if (values.length === 1) return () => values[0];

  // Check if all values are numbers
  const nums = values.map(Number);
  if (nums.every((n) => !isNaN(n))) {
    // Detect arithmetic progression
    const diffs: number[] = [];
    for (let i = 1; i < nums.length; i++) diffs.push(nums[i] - nums[i - 1]);
    const allSame = diffs.every((d) => Math.abs(d - diffs[0]) < 1e-10);
    if (allSame && diffs.length > 0) {
      const step = diffs[0];
      const last = nums[nums.length - 1];
      return (index: number) => last + step * (index + 1);
    }
    // No clear progression — cycle through values
    return (index: number) => nums[index % nums.length];
  }

  // Check if all values are dates
  const dates = values.map((v) => {
    if (v instanceof Date) return v.getTime();
    const t = new Date(String(v)).getTime();
    return isNaN(t) ? null : t;
  });
  if (dates.every((d) => d !== null)) {
    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) intervals.push(dates[i]! - dates[i - 1]!);
    const allSame = intervals.every((d) => d === intervals[0]);
    if (allSame && intervals.length > 0) {
      const step = intervals[0];
      const last = dates[dates.length - 1]!;
      return (index: number) => new Date(last + step * (index + 1)).toISOString().slice(0, 10);
    }
  }

  // Default: cycle through values
  return (index: number) => values[index % values.length];
}

// ─── Fill Handle Overlay Component ──────────────────────────

interface FillHandleState {
  isDragging: boolean;
  dragRow: number | null;
  dragCol: number | null;
  sourceSpan: { r0: number; r1: number; c0: number; c1: number } | null;
}

function useFillHandle(ctx: TableContext) {
  const [state, setState] = useState<FillHandleState>({
    isDragging: false,
    dragRow: null,
    dragCol: null,
    sourceSpan: null,
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  const getHandlePosition = useCallback(() => {
    const sel = ctx.selection;
    const container = ctx.containerRef.current;
    if (!sel.span || !container || !ctx.editing) return null;

    const r1 = Math.max(sel.span.anchor.row, sel.span.focus.row);
    const c1 = Math.max(sel.span.anchor.col, sel.span.focus.col);

    // Find the row element in the DOM
    const rowEl = container.querySelector(`[data-index="${r1}"]`);
    if (!rowEl) return null;

    // Find the cell — cells are child divs in order
    const cellEl = rowEl.children[c1] as HTMLElement | undefined;
    if (!cellEl) return null;

    const containerRect = container.getBoundingClientRect();
    const cellRect = cellEl.getBoundingClientRect();

    return {
      left: cellRect.right - containerRect.left + container.scrollLeft - 4,
      top: cellRect.bottom - containerRect.top + container.scrollTop - 4,
    };
  }, [ctx.selection, ctx.containerRef, ctx.editing]);

  const findCellFromPoint = useCallback(
    (clientX: number, clientY: number): { row: number; col: number } | null => {
      const container = ctx.containerRef.current;
      if (!container) return null;

      // Find row by querying elements at the y position
      const elements = document.elementsFromPoint(clientX, clientY);
      for (const el of elements) {
        const index = (el as HTMLElement).dataset?.index;
        if (index !== undefined) {
          const rowIndex = parseInt(index, 10);
          // Find column by x position
          const rowEl = el as HTMLElement;
          let colIndex = 0;
          for (let i = 0; i < rowEl.children.length; i++) {
            const cellRect = rowEl.children[i].getBoundingClientRect();
            if (clientX >= cellRect.left && clientX <= cellRect.right) {
              colIndex = i;
              break;
            }
          }
          return { row: rowIndex, col: colIndex };
        }
      }
      return null;
    },
    [ctx.containerRef],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const sel = ctx.selection.span;
      if (!sel) return;

      const bounds = spanBounds(sel);
      setState({ isDragging: true, dragRow: bounds.r1, dragCol: bounds.c1, sourceSpan: bounds });

      const onMouseMove = (me: MouseEvent) => {
        const cell = findCellFromPoint(me.clientX, me.clientY);
        if (cell) {
          setState((prev) => ({ ...prev, dragRow: cell.row, dragCol: cell.col }));
        }

        // Auto-scroll near edges
        const container = ctx.containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const scrollMargin = 30;
          const scrollSpeed = 8;
          if (me.clientY > rect.bottom - scrollMargin) container.scrollTop += scrollSpeed;
          else if (me.clientY < rect.top + scrollMargin) container.scrollTop -= scrollSpeed;
          if (me.clientX > rect.right - scrollMargin) container.scrollLeft += scrollSpeed;
          else if (me.clientX < rect.left + scrollMargin) container.scrollLeft -= scrollSpeed;
        }
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        // Execute fill
        const s = stateRef.current;
        if (s.sourceSpan && s.dragRow !== null) {
          executeFill(ctx, s.sourceSpan, s.dragRow, s.dragCol ?? s.sourceSpan.c1);
        }

        setState({ isDragging: false, dragRow: null, dragCol: null, sourceSpan: null });
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "crosshair";
      document.body.style.userSelect = "none";
    },
    [ctx, findCellFromPoint],
  );

  const handleDblClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const sel = ctx.selection.span;
      if (!sel) return;

      const { r0, r1, c0, c1 } = spanBounds(sel);

      // Auto-fill: find the extent of the adjacent column
      const refCol = c0 > 0 ? c0 - 1 : c1 + 1;
      if (refCol < 0 || refCol >= ctx.columns.length) return;

      const refField = ctx.columns[refCol].field;
      let lastRow = r1;
      for (let r = r1 + 1; r < ctx.rows.length; r++) {
        const val = ctx.rows[r]?.[refField];
        if (val === null || val === undefined || val === "") break;
        lastRow = r;
      }

      if (lastRow > r1) {
        executeFill(ctx, { r0, r1, c0, c1 }, lastRow, c1);
      }
    },
    [ctx],
  );

  return { state, getHandlePosition, handleMouseDown, handleDblClick };
}

/** Execute the fill operation — computes values and commits edits in batch. */
async function executeFill(
  ctx: TableContext,
  source: { r0: number; r1: number; c0: number; c1: number },
  targetRow: number,
  targetCol: number,
) {
  if (!ctx.editing) return;

  // Determine fill direction: vertical (down/up) vs horizontal (right/left)
  const fillDown = targetRow > source.r1;
  const fillUp = targetRow < source.r0;
  const fillRight = targetCol > source.c1;
  const fillLeft = targetCol < source.c0;

  // Emit batch start
  ctx.emit("editing:batchStart");

  try {
    if (fillDown || fillUp) {
      const startRow = fillDown ? source.r1 + 1 : targetRow;
      const endRow = fillDown ? targetRow : source.r0 - 1;

      for (let c = source.c0; c <= source.c1; c++) {
        const col = ctx.columns[c];
        if (!col || col.editable === false) continue;

        // Gather source values for this column
        const sourceValues = [];
        for (let r = source.r0; r <= source.r1; r++) {
          sourceValues.push(ctx.rows[r]?.[col.field]);
        }
        const pattern = detectPattern(sourceValues);

        for (let r = startRow; r <= endRow; r++) {
          const row = ctx.rows[r];
          if (!row || row.__placeholder === true || row.__group === true) continue;
          const rowId = getRowId(row, r);
          const value = pattern(r - startRow);
          const cell: CellRef = {
            rowIndex: r,
            colIndex: c,
            rowId,
            field: col.field,
            value: row[col.field],
          };
          await ctx.editing!.commitEdit(cell, value);
        }
      }
    } else if (fillRight || fillLeft) {
      const startCol = fillRight ? source.c1 + 1 : targetCol;
      const endCol = fillRight ? targetCol : source.c0 - 1;

      for (let r = source.r0; r <= source.r1; r++) {
        const row = ctx.rows[r];
        if (!row || row.__placeholder === true || row.__group === true) continue;
        const rowId = getRowId(row, r);

        // Gather source values for this row
        const sourceValues = [];
        for (let c = source.c0; c <= source.c1; c++) {
          sourceValues.push(row[ctx.columns[c].field]);
        }
        const pattern = detectPattern(sourceValues);

        for (let c = startCol; c <= endCol; c++) {
          const col = ctx.columns[c];
          if (!col || col.editable === false) continue;
          const value = pattern(c - startCol);
          const cell: CellRef = {
            rowIndex: r,
            colIndex: c,
            rowId,
            field: col.field,
            value: row[col.field],
          };
          await ctx.editing!.commitEdit(cell, value);
        }
      }
    }
  } finally {
    ctx.emit("editing:batchEnd");
  }
}

// ─── Fill Down / Fill Right ─────────────────────────────────

function spanBounds(span: {
  anchor: { row: number; col: number };
  focus: { row: number; col: number };
}) {
  return {
    r0: Math.min(span.anchor.row, span.focus.row),
    r1: Math.max(span.anchor.row, span.focus.row),
    c0: Math.min(span.anchor.col, span.focus.col),
    c1: Math.max(span.anchor.col, span.focus.col),
  };
}

function fillDirection(ctx: TableContext, dir: "down" | "right") {
  const sel = ctx.selection.span;
  if (!sel || !ctx.editing) return;
  const { r0, r1, c0, c1 } = spanBounds(sel);
  if (dir === "down") {
    if (r1 <= r0) return;
    executeFill(ctx, { r0, r1: r0, c0, c1 }, r1, c1);
  } else {
    if (c1 <= c0) return;
    executeFill(ctx, { r0, r1, c0, c1: c0 }, r1, c1);
  }
}

// ─── FillHandleOverlay React Component ──────────────────────

function FillHandleOverlay({ ctx }: { ctx: TableContext }) {
  const { state, getHandlePosition, handleMouseDown, handleDblClick } = useFillHandle(ctx);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  // Recalculate position on selection change and scroll
  useEffect(() => {
    setPos(getHandlePosition());
    const container = ctx.containerRef.current;
    if (!container) return;
    const onScroll = () => setPos(getHandlePosition());
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [ctx.selection, ctx.activeCell, getHandlePosition, ctx.containerRef]);

  if (!pos || !ctx.editing) return null;

  // Preview highlight during drag
  let previewEl = null;
  if (state.isDragging && state.sourceSpan && state.dragRow !== null) {
    const container = ctx.containerRef.current;
    if (container) {
      const { r0, r1, c0, c1 } = state.sourceSpan;
      const dragR = state.dragRow;
      const dragC = state.dragCol ?? c1;

      // Determine the preview range
      let pR0: number, pR1: number, pC0: number, pC1: number;
      if (dragR > r1) {
        pR0 = r1 + 1;
        pR1 = dragR;
        pC0 = c0;
        pC1 = c1;
      } else if (dragR < r0) {
        pR0 = dragR;
        pR1 = r0 - 1;
        pC0 = c0;
        pC1 = c1;
      } else if (dragC > c1) {
        pR0 = r0;
        pR1 = r1;
        pC0 = c1 + 1;
        pC1 = dragC;
      } else if (dragC < c0) {
        pR0 = r0;
        pR1 = r1;
        pC0 = dragC;
        pC1 = c0 - 1;
      } else {
        pR0 = pR1 = pC0 = pC1 = -1;
      }

      if (pR0 >= 0) {
        // Find DOM positions for the preview rectangle
        const startRowEl = container.querySelector(`[data-index="${pR0}"]`);
        const endRowEl = container.querySelector(`[data-index="${pR1}"]`);
        if (startRowEl && endRowEl) {
          const startCell = startRowEl.children[pC0] as HTMLElement | undefined;
          const endCell = endRowEl.children[pC1] as HTMLElement | undefined;
          if (startCell && endCell) {
            const startRect = startCell.getBoundingClientRect();
            const endRect = endCell.getBoundingClientRect();
            previewEl = createElement("div", {
              style: {
                position: "fixed",
                left: startRect.left,
                top: startRect.top,
                width: endRect.right - startRect.left,
                height: endRect.bottom - startRect.top,
                backgroundColor: "rgba(59, 130, 246, 0.12)",
                border: "2px dashed rgba(59, 130, 246, 0.5)",
                pointerEvents: "none",
                zIndex: 10,
              },
            });
          }
        }
      }
    }
  }

  return createElement(
    "div",
    null,
    // The fill handle square
    createElement("div", {
      onMouseDown: handleMouseDown,
      onDoubleClick: handleDblClick,
      style: {
        position: "absolute",
        left: pos.left,
        top: pos.top,
        width: 8,
        height: 8,
        backgroundColor: "#3b82f6",
        border: "1px solid #fff",
        cursor: "crosshair",
        zIndex: 6,
        borderRadius: 1,
      },
    }),
    previewEl,
  );
}

// ─── Plugin ─────────────────────────────────────────────────

export interface FillHandleOptions {
  /** Enable pattern detection for sequences. Default: true. */
  detectPatterns?: boolean;
}

export function fillHandle(_options?: FillHandleOptions): TablePlugin {
  return {
    name: "fillHandle",
    dependencies: ["selection", "editing"],

    renderOverlay(ctx: TableContext) {
      return createElement(FillHandleOverlay, { ctx });
    },

    contextMenuItems(ctx: TableContext, _cell: CellRef): MenuItem[] {
      const sel = ctx.selection?.span;
      if (!sel || !ctx.editing) return [];

      const { r0, r1, c0, c1 } = spanBounds(sel);
      const items: MenuItem[] = [];
      items.push(MENU_SEPARATOR);
      if (r1 > r0) {
        items.push({
          label: "Fill Down",
          shortcut: "Ctrl+D",
          action: () => fillDirection(ctx.getLatest(), "down"),
        });
      }
      if (c1 > c0) {
        items.push({
          label: "Fill Right",
          shortcut: "Ctrl+R",
          action: () => fillDirection(ctx.getLatest(), "right"),
        });
      }
      return items;
    },

    shortcuts: {
      "ctrl+d": (ctx: TableContext) => fillDirection(ctx, "down"),
      "ctrl+r": (ctx: TableContext) => fillDirection(ctx, "right"),
    },
  };
}
