import { memo, useCallback, useRef } from "react";
import { Pin, PencilLine, Sigma } from "lucide-react";
import type { ResolvedColumn, TableStyles } from "../types.js";
import type { SortField } from "@unify/table-core";

interface HeaderRowProps {
  column: ResolvedColumn;
  sort: SortField[];
  onSort: (sort: SortField[]) => void;
  onResize?: (field: string, width: number) => void;
  styles: TableStyles;
  px: number;
  py: number;
}

export const HeaderRow = memo(function HeaderRow({ column, sort, onSort, onResize, styles, px, py }: HeaderRowProps) {
  const currentSort = sort.find((s) => s.field === column.field);
  const sortable = column.sortable !== false;
  const resizable = column.resizable !== false && !!onResize;
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  function handleClick(e: React.MouseEvent) {
    // Don't sort if we just finished a resize drag
    if (dragRef.current) return;
    if (!sortable) return;
    if (!currentSort) {
      onSort([...sort, { field: column.field, dir: "asc" }]);
    } else if (currentSort.dir === "asc") {
      onSort(sort.map((s) => (s.field === column.field ? { ...s, dir: "desc" } : s)));
    } else {
      onSort(sort.filter((s) => s.field !== column.field));
    }
  }

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (!resizable) return;
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startWidth = column.currentWidth;
      let didDrag = false;

      let rafId = 0;
      const onMouseMove = (me: MouseEvent) => {
        didDrag = true;
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const delta = me.clientX - startX;
          const newWidth = Math.max(startWidth + delta, column.minWidth ?? 50);
          onResize!(column.field, newWidth);
        });
      };

      const onMouseUp = () => {
        cancelAnimationFrame(rafId);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        // Prevent the click handler from firing a sort after resize
        if (didDrag) {
          dragRef.current = { startX, startWidth };
          requestAnimationFrame(() => {
            dragRef.current = null;
          });
        }
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [resizable, column.currentWidth, column.field, column.minWidth, onResize],
  );

  // Double-click resize handle → auto-fit (reset to default)
  const handleResizeDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onResize) onResize(column.field, column.width ?? 150);
    },
    [onResize, column.field, column.width],
  );

  const sortIndicator = currentSort ? (currentSort.dir === "asc" ? " \u2191" : " \u2193") : "";

  return (
    <div
      className={styles.headerCell ?? ""}
      style={{
        width: column.currentWidth,
        minWidth: column.minWidth ?? 50,
        maxWidth: column.maxWidth,
        flexShrink: 0,
        flexGrow: 0,
        textAlign: column.align ?? "left",
        overflow: "hidden",
        boxSizing: "border-box",
        padding: `${py}px ${px}px`,
        position: column.pin ? "sticky" : "relative",
        backgroundColor: "inherit",
        ...(column.pin === "left" ? { left: column._pinOffset ?? 0, zIndex: 2 } : {}),
        ...(column.pin === "right" ? { right: column._pinOffset ?? 0, zIndex: 2 } : {}),
        ...(column._pinEdge
          ? {
              boxShadow:
                column.pin === "left"
                  ? "4px 0 8px -4px rgba(0,0,0,0.15)"
                  : "-4px 0 8px -4px rgba(0,0,0,0.15)",
            }
          : {}),
      }}
      onClick={handleClick}
      role="columnheader"
      aria-sort={
        currentSort
          ? currentSort.dir === "asc"
            ? "ascending"
            : "descending"
          : sortable
            ? "none"
            : undefined
      }
      data-field={column.field}
      tabIndex={0}
    >
      <span
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "flex",
          alignItems: "center",
          gap: 4,
          paddingRight: resizable ? 8 : 0,
        }}
      >
        {column.pin && <Pin size={10} style={{ opacity: 0.4, flexShrink: 0 }} />}
        {column._isFormula && <Sigma size={10} style={{ opacity: 0.4, flexShrink: 0 }} />}
        {column.editable !== false && (column.editor || column._isFormula) && (
          <PencilLine size={10} style={{ opacity: 0.35, flexShrink: 0 }} />
        )}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {column.label ?? column.field}
          {sortIndicator}
        </span>
      </span>

      {/* Resize handle */}
      {resizable && (
        <div
          onMouseDown={handleResizeStart}
          onDoubleClick={handleResizeDoubleClick}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 6,
            cursor: "col-resize",
            zIndex: 1,
          }}
          role="separator"
          aria-orientation="vertical"
        >
          {/* Visible line on hover */}
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "20%",
              bottom: "20%",
              width: 2,
              borderRadius: 1,
              backgroundColor: "currentColor",
              opacity: 0.15,
              transition: "opacity 0.15s",
            }}
            className="resize-indicator"
          />
        </div>
      )}
    </div>
  );
});
