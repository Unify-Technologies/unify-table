import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown } from "lucide-react";
import type { DisplayConfig, ColumnInfo } from "@unify/table-core";
import { useTableContext } from "../hooks/useTableContext.js";
import { HeaderRow } from "./HeaderRow.js";
import { TableRow } from "./TableRow.js";
import { GroupRow } from "./GroupRow.js";
import { isGroupRow, serializeGroupKey } from "../plugins/row_grouping.js";
import { PanelShell } from "../panels/PanelShell.js";
import { DisplayRenderer } from "../displays/DisplayRenderer.js";
import { registerDefaultDisplays } from "../displays/defaults.js";
import { getDisplay } from "../displays/registry.js";
import type { PanelConfig } from "../panels/types.js";
import type { AggFn } from "../panels/types.js";
import type {
  TableProps,
  TableContext,
  TablePlugin,
  TableStyles,
  MenuItem,
  ColumnDef,
  CellRef,
  ResolvedColumn,
} from "../types.js";
import { isInAnySpan, isFullRowSpan } from "../types.js";
import { getRowId, buildPinStyle } from "../utils.js";

// Register built-in display types on first import
registerDefaultDisplays();

const DENSITY = {
  compact: { rowHeight: 28, fontSize: "0.75rem", px: 8, py: 2 },
  comfortable: { rowHeight: 36, fontSize: "0.875rem", px: 12, py: 6 },
  spacious: { rowHeight: 48, fontSize: "1rem", px: 16, py: 12 },
} as const;

export type DensityValues = (typeof DENSITY)[keyof typeof DENSITY];

function mergeStyles(base: TableStyles, override?: TableStyles): TableStyles {
  if (!override) return base;
  const result: TableStyles = { ...base };
  for (const key of Object.keys(override) as (keyof TableStyles)[]) {
    const b = base[key] ?? "";
    const o = override[key];
    result[key] = o ? (b ? `${b} ${o}` : o) : b;
  }
  return result;
}

const DEFAULT_PANELS: PanelConfig[] = [
  "columns",
  "filters",
  "groupBy",
  "displays",
  "export",
  "debug",
];

// ── Inline cell editor ──────────────────────────────────────

interface InlineEditorProps {
  column: ResolvedColumn;
  cell: CellRef;
  styles: TableStyles;
  px: number;
  py: number;
  onCommit: (value: unknown) => void;
  onCancel: () => void;
}

function InlineEditor({ column, cell, styles, px, py, onCommit, onCancel }: InlineEditorProps) {
  const [draft, setDraft] = useState(cell.value != null ? String(cell.value) : "");
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    // Place caret at end so the user can continue editing
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, []);

  const commit = () => {
    const editor = column.editor ?? "text";
    let value: unknown = draft;
    if (editor === "number") {
      const n = Number(draft);
      value = Number.isNaN(n) ? draft : n;
    } else if (editor === "checkbox") {
      value = draft === "true";
    }
    onCommit(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Stop propagation so the keyboard plugin (on the container) doesn't interfere
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    } else if (e.key === "Tab") {
      e.preventDefault();
      commit();
    }
  };

  // Prevent clicks inside the editor from bubbling to the row/container
  // (which would steal focus and trigger cell:click selection events)
  const stopClick = (e: React.MouseEvent) => e.stopPropagation();
  const stopMouseDown = (e: React.MouseEvent) => e.stopPropagation();

  const pinStyle = buildPinStyle(column, 2);

  const cellCss: React.CSSProperties = {
    width: column.currentWidth,
    minWidth: column.minWidth ?? 50,
    maxWidth: column.maxWidth,
    flexShrink: 0,
    flexGrow: 0,
    boxSizing: "border-box",
    padding: 0,
    outline: "2px solid #3b82f6",
    outlineOffset: -2,
    position: "relative" as const,
    zIndex: 1,
    ...pinStyle,
  };

  const inputCss: React.CSSProperties = {
    width: "100%",
    height: "100%",
    border: "none",
    outline: "none",
    background: "var(--utbl-cell-edit-bg, var(--utbl-row-bg, #1a1a2e))",
    color: "inherit",
    font: "inherit",
    padding: `${py}px ${px}px`,
    boxSizing: "border-box",
    textAlign: column.align ?? "left",
    userSelect: "text",
    WebkitUserSelect: "text",
    cursor: "text",
  };

  const editor = column.editor ?? "text";

  if (editor === "select" && column.editorOptions) {
    const selectCss: React.CSSProperties = {
      ...inputCss,
      appearance: "none",
      WebkitAppearance: "none",
      paddingRight: 24,
    };

    if (column.editorFreeform) {
      const listId = `utbl-dl-${column.field}`;
      const allOptions = column.editorOptions.map(String);
      if (draft && !allOptions.includes(draft)) allOptions.push(draft);
      return (
        <div
          className={`${styles.cell ?? ""} ${styles.cellEditing ?? ""}`}
          style={cellCss}
          onClick={stopClick}
          onMouseDown={stopMouseDown}
        >
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            list={listId}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
            }}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            style={selectCss}
          />
          <datalist id={listId}>
            {allOptions.map((opt) => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
          <ChevronDown
            size={14}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              opacity: 0.5,
            }}
          />
        </div>
      );
    }

    return (
      <div
        className={`${styles.cell ?? ""} ${styles.cellEditing ?? ""}`}
        style={cellCss}
        onClick={stopClick}
        onMouseDown={stopMouseDown}
      >
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
          }}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          style={selectCss}
        >
          {column.editorOptions.map((opt) => (
            <option key={String(opt)} value={String(opt)}>
              {String(opt)}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            opacity: 0.5,
          }}
        />
      </div>
    );
  }

  if (editor === "textarea") {
    return (
      <div
        className={`${styles.cell ?? ""} ${styles.cellEditing ?? ""}`}
        style={cellCss}
        onClick={stopClick}
        onMouseDown={stopMouseDown}
      >
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          style={{ ...inputCss, resize: "none" }}
        />
      </div>
    );
  }

  return (
    <div
      className={`${styles.cell ?? ""} ${styles.cellEditing ?? ""}`}
      style={cellCss}
      onClick={stopClick}
      onMouseDown={stopMouseDown}
    >
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={editor === "date" ? "date" : "text"}
        inputMode={editor === "number" ? "decimal" : undefined}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        style={inputCss}
      />
    </div>
  );
}

// ── Table component ─────────────────────────────────────────

export function Table(props: TableProps) {
  const {
    db,
    table,
    columns: columnsProp,
    plugins,
    styles: stylesProp,
    className,
    density = "comfortable",
    rowStyle,
    onRowClick,
    height = 600,
    pageSize,
    rowId,
    renderFooter,
    onTotalCount,
    panels: panelsProp,
    panelPosition = "right",
    displays: displaysProp,
    onDisplaysChange,
    onActiveDisplayChange,
    initialActiveDisplay,
    initialSort,
    onSortChange,
    initialFilterValues,
    onFilterValuesChange,
    initialGroupBy,
    onGroupByChange,
    initialHiddenCols,
    onHiddenColsChange,
    initialAggFns,
    onAggFnsChange,
    initialColumnOrder,
    onColumnOrderChange,
    initialColumnWidths,
    onColumnWidthsChange,
  } = props;

  const showPanels = panelsProp !== false;
  const panelConfigs = useMemo(() => {
    if (!showPanels) return [];
    if (Array.isArray(panelsProp)) return panelsProp;

    const pluginNames = new Set(plugins?.map((p) => p.name) ?? []);
    const PLUGIN_PANEL_MAP: Record<string, string[]> = {
      columns: ["columnReorder", "columnResize", "columnPin"],
      filters: ["filters"],
      groupBy: ["rowGrouping"],
    };

    return DEFAULT_PANELS.filter((p) => {
      const key = typeof p === "string" ? p : p.key;
      const requiredPlugins = PLUGIN_PANEL_MAP[key];
      return !requiredPlugins || requiredPlugins.some((p) => pluginNames.has(p));
    });
  }, [showPanels, panelsProp, plugins]);

  // Panel state — lives here so useTableContext receives the filtered columns
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(() => new Set(initialHiddenCols ?? []));
  const [groupByCols, setGroupByCols] = useState<string[]>(initialGroupBy ?? []);
  const [aggFns, setAggFns] = useState<Record<string, AggFn>>(
    (initialAggFns ?? {}) as Record<string, AggFn>,
  );

  // ── Display state ─────────────────────────────────────────
  const [displays, setDisplays] = useState<DisplayConfig[]>(displaysProp ?? []);
  const [activeDisplay, setActiveDisplay] = useState<string | null>(initialActiveDisplay ?? null);
  const displayIdCounter = useRef(
    displaysProp?.reduce((max, d) => {
      const m = d.id.match(/^d_(\d+)$/);
      return m ? Math.max(max, Number(m[1])) : max;
    }, 0) ?? 0,
  );
  const schemaColumnsRef = useRef<ColumnInfo[]>([]);

  // Sync external displays prop
  useEffect(() => {
    if (displaysProp) setDisplays(displaysProp);
  }, [displaysProp]);

  // Notify parent when active display changes
  useEffect(() => {
    const displayType = activeDisplay
      ? (displays.find((d) => d.id === activeDisplay)?.type ?? null)
      : null;
    onActiveDisplayChange?.(displayType);
  }, [activeDisplay, displays, onActiveDisplayChange]);

  const updateDisplays = useCallback(
    (next: DisplayConfig[]) => {
      setDisplays(next);
      onDisplaysChange?.(next);
    },
    [onDisplaysChange],
  );

  const handleAddDisplay = useCallback(
    (typeKey: string) => {
      const descriptor = getDisplay(typeKey);
      if (!descriptor) return;
      const id = `d_${++displayIdCounter.current}`;
      const newDisplay: DisplayConfig = {
        id,
        type: typeKey,
        label: descriptor.type.label,
        config: descriptor.type.defaultConfig(schemaColumnsRef.current) as Record<string, unknown>,
      };
      // Replace any existing display — only one allowed at a time
      updateDisplays([newDisplay]);
      setActiveDisplay(id);
    },
    [updateDisplays],
  );

  const handleRemoveDisplay = useCallback(
    (id: string) => {
      updateDisplays(displays.filter((d) => d.id !== id));
      if (activeDisplay === id) setActiveDisplay(null);
    },
    [displays, activeDisplay, updateDisplays],
  );

  const handleDisplayConfigChange = useCallback(
    (id: string, config: Record<string, unknown>) => {
      updateDisplays(displays.map((d) => (d.id === id ? { ...d, config } : d)));
    },
    [displays, updateDisplays],
  );

  // Resolve original columns for the panel (before hiding)
  const originalColumns = useMemo<ColumnDef[]>(() => {
    if (!columnsProp) return [];
    return columnsProp.map((c) => (typeof c === "string" ? { field: c } : c));
  }, [columnsProp]);

  // Capture initial column order/widths in refs so they're only used on mount
  // (avoids feedback loop when onColumnWidthsChange updates dockview params)
  const initialColumnOrderRef = useRef(initialColumnOrder);
  const initialColumnWidthsRef = useRef(initialColumnWidths);

  // Visible columns = original minus hidden, with grouped columns first, with initial widths applied
  const visibleColumns = useMemo(() => {
    let cols = originalColumns.filter((c) => !hiddenCols.has(c.field));
    if (groupByCols.length > 0) {
      const grouped = cols.filter((c) => groupByCols.includes(c.field));
      const rest = cols.filter((c) => !groupByCols.includes(c.field));
      cols = [...grouped, ...rest];
    }
    const order = initialColumnOrderRef.current;
    if (order && order.length > 0) {
      const byField = new Map(cols.map((c) => [c.field, c]));
      const ordered: ColumnDef[] = [];
      for (const field of order) {
        const col = byField.get(field);
        if (col) ordered.push(col);
      }
      for (const col of cols) {
        if (!order.includes(col.field)) ordered.push(col);
      }
      cols = ordered;
    }
    const widths = initialColumnWidthsRef.current;
    if (widths) {
      cols = cols.map((c) => {
        const w = widths[c.field];
        return w != null ? { ...c, width: w } : c;
      });
    }
    return cols;
  }, [originalColumns, hiddenCols, groupByCols]);

  const ctx = useTableContext({
    db,
    table,
    columns: visibleColumns.length > 0 ? visibleColumns : columnsProp,
    plugins,
    pageSize,
    rowId,
  });
  const styles = useMemo(() => mergeStyles({}, stylesProp), [stylesProp]);
  const d = DENSITY[density];

  // Sync groupBy state to ctx
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  useEffect(() => {
    ctxRef.current.setGroupBy(groupByCols);
  }, [groupByCols]);

  // Apply initial sort once on mount
  const appliedInitialSort = useRef(false);
  useEffect(() => {
    if (appliedInitialSort.current) return;
    if (!initialSort || initialSort.length === 0) return;
    appliedInitialSort.current = true;
    ctxRef.current.setSort(initialSort);
  }, [initialSort]);

  // Notify parent of sort changes
  useEffect(() => {
    if (!onSortChange) return;
    return ctx.on("sort", (payload) => {
      onSortChange(payload as import("@unify/table-core").SortField[]);
    });
  }, [ctx, onSortChange]);

  // Notify parent of groupBy changes
  useEffect(() => {
    onGroupByChange?.(groupByCols);
  }, [groupByCols, onGroupByChange]);

  // Notify parent of hidden cols changes
  useEffect(() => {
    onHiddenColsChange?.([...hiddenCols]);
  }, [hiddenCols, onHiddenColsChange]);

  // Notify parent of aggFns changes
  useEffect(() => {
    onAggFnsChange?.(aggFns as Record<string, string>);
  }, [aggFns, onAggFnsChange]);

  // Apply initial __group__ column width (synthetic column, not in column defs)
  const appliedInitialGroupWidth = useRef(false);
  useEffect(() => {
    if (appliedInitialGroupWidth.current) return;
    const widths = initialColumnWidthsRef.current;
    if (!widths || widths["__group__"] == null) return;
    if (ctx.columns.length === 0) return;
    if (!ctx.columns.some((c) => c.field === "__group__")) return;
    appliedInitialGroupWidth.current = true;
    ctx.setColumnWidth("__group__", widths["__group__"]);
  }, [ctx]);

  // Notify parent of column order changes
  useEffect(() => {
    if (!onColumnOrderChange) return;
    return ctx.on("column:reorder", (payload) => {
      onColumnOrderChange(payload as string[]);
    });
  }, [ctx, onColumnOrderChange]);

  // Notify parent of column width changes — derive from resolved columns
  const prevWidthsRef = useRef<string>("");
  useEffect(() => {
    if (!onColumnWidthsChange) return;
    if (ctx.columns.length === 0) return;
    const widths: Record<string, number> = {};
    for (const col of ctx.columns) {
      widths[col.field] = col.currentWidth;
    }
    const key = JSON.stringify(widths);
    if (key !== prevWidthsRef.current) {
      prevWidthsRef.current = key;
      onColumnWidthsChange(widths);
    }
  }, [ctx.columns, onColumnWidthsChange]);

  // Sync aggregations to rowGrouping plugin
  const aggregations = useMemo(
    () =>
      Object.entries(aggFns)
        .filter(([, fn]) => fn !== "")
        .map(([field, fn]) => ({ field, fn: fn as Exclude<AggFn, ""> })),
    [aggFns],
  );

  useEffect(() => {
    ctxRef.current.emit("group:aggregations", aggregations);
  }, [aggregations]);

  // Notify parent of totalCount changes
  useEffect(() => {
    if (onTotalCount && ctx.totalCount > 0) onTotalCount(ctx.totalCount);
  }, [ctx.totalCount, onTotalCount]);

  // ── Schema columns for display config panels ──────────
  const [schemaColumns, setSchemaColumns] = useState<ColumnInfo[]>([]);
  useEffect(() => {
    ctx.engine
      .columns(table)
      .then((cols) => {
        setSchemaColumns(cols);
        schemaColumnsRef.current = cols;
      })
      .catch(() => {});
  }, [ctx.engine, table]);

  const activeDisplayConfig = activeDisplay ? displays.find((d) => d.id === activeDisplay) : null;

  // ── Content area: either TableView or active display ──
  // Displays query the base table directly — the internal view may be stale after HMR/remount
  const contentArea = activeDisplayConfig ? (
    <DisplayRenderer
      display={activeDisplayConfig}
      viewName={table}
      engine={ctx.engine}
      columns={schemaColumns}
      onConfigChange={(config) => handleDisplayConfigChange(activeDisplayConfig.id, config)}
      showConfig={false}
      showSql={false}
    />
  ) : (
    <TableView
      ctx={ctx}
      styles={styles}
      density={d}
      plugins={plugins}
      height={height}
      rowStyle={rowStyle}
      onRowClick={onRowClick}
      renderFooter={renderFooter}
    />
  );

  if (!showPanels) {
    return (
      <div
        className={className ?? ""}
        style={{
          display: "flex",
          flexDirection: "column",
          height: height === "100%" ? "100%" : undefined,
          minHeight: 0,
        }}
      >
        {contentArea}
      </div>
    );
  }

  const panel = (
    <PanelShell
      ctx={ctx}
      columns={originalColumns}
      panels={panelConfigs}
      hiddenCols={hiddenCols}
      setHiddenCols={setHiddenCols}
      groupByCols={groupByCols}
      setGroupByCols={setGroupByCols}
      aggFns={aggFns}
      setAggFns={setAggFns}
      initialFilterValues={initialFilterValues}
      onFilterValuesChange={onFilterValuesChange}
      displays={displays}
      activeDisplay={activeDisplay}
      onActivateDisplay={setActiveDisplay}
      onAddDisplay={handleAddDisplay}
      onRemoveDisplay={handleRemoveDisplay}
      onDisplayConfigChange={handleDisplayConfigChange}
      schemaColumns={schemaColumns}
    />
  );

  const resolvedHeight =
    height === "100%" ? "100%" : typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={className ?? ""}
      style={{ display: "flex", height: resolvedHeight, minHeight: 0 }}
    >
      {panelPosition === "left" && panel}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {contentArea}
      </div>
      {panelPosition === "right" && panel}
    </div>
  );
}

/** Placeholder row for rows not yet fetched */
const PLACEHOLDER_ROW = { __placeholder: true } as Record<string, unknown>;

// ── Memoized virtual row ────────────────────────────────────

interface VirtualRowItemProps {
  row: Record<string, unknown>;
  virtualStart: number;
  virtualIndex: number;
  virtualKey: React.Key;
  isEven: boolean;
  isPlaceholder: boolean;
  isGroup: boolean;
  isSelected: boolean;
  isGroupSelected: boolean;
  columns: ResolvedColumn[];
  groupBy: string[];
  styles: TableStyles;
  density: DensityValues;
  selection: import("../types.js").SelectionState;
  ctx: TableContext;
  rowStyleClass: string;
  measureElement: (el: HTMLElement | null) => void;
  onRowClick: (row: Record<string, unknown>, index: number, e: React.MouseEvent) => void;
  onRowDoubleClick: (row: Record<string, unknown>, index: number, e: React.MouseEvent) => void;
  onGroupToggle: (gk: Record<string, unknown>, depth: number) => void;
}

const VirtualRowItem = memo(function VirtualRowItem({
  row,
  virtualStart,
  virtualIndex,
  virtualKey,
  isEven,
  isPlaceholder,
  isGroup,
  isSelected,
  isGroupSelected,
  columns,
  groupBy,
  styles,
  density,
  selection,
  ctx,
  rowStyleClass,
  measureElement,
  onRowClick,
  onRowDoubleClick,
  onGroupToggle,
}: VirtualRowItemProps) {
  const rowClass = [
    styles.row,
    isGroup ? "" : isEven ? styles.rowEven : "",
    isSelected ? styles.rowSelected : "",
    rowStyleClass,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      key={virtualKey}
      data-index={virtualIndex}
      ref={measureElement}
      role="row"
      aria-rowindex={virtualIndex + 2}
      aria-selected={isSelected || isGroupSelected || undefined}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        minWidth: "fit-content",
        transform: `translateY(${virtualStart}px)`,
        display: "flex",
        height: `${density.rowHeight}px`,
        alignItems: "center",
        opacity: isPlaceholder ? 0.3 : 1,
        cursor: isPlaceholder ? undefined : isGroup ? "pointer" : "cell",
        ...(isSelected ? { backgroundColor: "var(--row-selected-bg, #1e3a5f)" } : {}),
      }}
      className={`utbl-vrow ${rowClass}`}
      onClick={
        !isPlaceholder ? (e) => onRowClick(row, virtualIndex, e) : undefined
      }
      onDoubleClick={
        !isPlaceholder && !isGroup
          ? (e) => onRowDoubleClick(row, virtualIndex, e)
          : undefined
      }
    >
      {isPlaceholder ? (
        <div
          className="utbl-placeholder-text"
          style={{
            padding: `${density.py}px ${density.px}px`,
            color: "#666",
            fontSize: "0.75rem",
          }}
        >
          Loading...
        </div>
      ) : isGroup ? (
        <GroupRow
          row={row}
          columns={columns}
          groupBy={groupBy}
          styles={styles}
          density={density}
          activeCell={ctx.activeCell}
          virtualIndex={virtualIndex}
          isGroupSelected={isGroupSelected}
          onToggle={onGroupToggle}
        />
      ) : (
        columns.map((col, colIdx) => {
          const inSpan = isInAnySpan(virtualIndex, colIdx, selection);
          const isActive =
            ctx.activeCell?.rowIndex === virtualIndex &&
            ctx.activeCell?.colIndex === colIdx;
          const isEditingThis =
            ctx.editing?.editingCell?.rowIndex === virtualIndex &&
            ctx.editing?.editingCell?.colIndex === colIdx;

          if (isEditingThis) {
            const isFormulaEdit = col._isFormula && ctx.formulas;
            const editorCell = isFormulaEdit
              ? {
                  ...ctx.editing!.editingCell!,
                  value: ctx.formulas!.getExpression(col.field) ?? "",
                }
              : ctx.editing!.editingCell!;
            const handleCommit = isFormulaEdit
              ? (value: unknown) => {
                  ctx
                    .formulas!.updateExpression(col.field, String(value))
                    .then(() => ctx.editing!.cancelEdit())
                    .catch((err) => ctx.emit("error", err));
                }
              : (value: unknown) =>
                  ctx.editing!.commitEdit(ctx.editing!.editingCell!, value);

            return (
              <InlineEditor
                key={col.field}
                column={isFormulaEdit ? { ...col, editor: "text" } : col}
                cell={editorCell}
                styles={styles}
                px={density.px}
                py={density.py}
                onCommit={handleCommit}
                onCancel={() => ctx.editing!.cancelEdit()}
              />
            );
          }

          return (
            <TableRow
              key={col.field}
              column={col}
              row={row}
              styles={styles}
              px={density.px}
              py={density.py}
              isCellSelected={inSpan}
              isActiveCell={isActive}
            />
          );
        })
      )}
    </div>
  );
});

export function TableView({
  ctx,
  styles,
  density,
  className,
  height,
  rowStyle,
  onRowClick,
  renderFooter,
  plugins,
}: {
  ctx: TableContext;
  styles: TableStyles;
  density: DensityValues;
  className?: string;
  height: number | string;
  rowStyle?: (row: Record<string, unknown>, index: number) => string;
  onRowClick?: (row: Record<string, unknown>) => void;
  renderFooter?: (info: {
    totalCount: number;
    isLoading: boolean;
    selection: import("../types.js").SelectionState;
  }) => React.ReactNode;
  plugins?: TablePlugin[];
}) {
  const {
    rows,
    columns,
    isLoading,
    totalCount,
    sort,
    containerRef,
    requestRange,
    selection,
    setColumnWidth,
    groupBy,
  } = ctx;

  // Map sort state so the __group__ header shows the correct indicator.
  // All groupBy fields collapse into a single __group__ entry (use first match's direction).
  const headerSort = useMemo(() => {
    if (groupBy.length === 0) return sort;
    const groupSet = new Set(groupBy);
    let groupDir: "asc" | "desc" | null = null;
    const filtered: typeof sort = [];
    for (const s of sort) {
      if (groupSet.has(s.field)) {
        if (groupDir === null) groupDir = s.dir; // take direction from first grouped field
      } else {
        filtered.push(s);
      }
    }
    if (groupDir !== null) filtered.unshift({ field: "__group__", dir: groupDir });
    return filtered;
  }, [sort, groupBy]);

  // When plugins transform rows (e.g. grouping), use the transformed array length.
  // Otherwise use totalCount for virtual scrolling over the full dataset.
  const displayCount =
    groupBy.length > 0 && rows.length > 0 && rows.length < totalCount ? rows.length : totalCount;

  const virtualizer = useVirtualizer({
    count: displayCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => density.rowHeight,
    overscan: 20,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalHeight = virtualizer.getTotalSize();

  // When virtual range changes, request those pages
  useEffect(() => {
    if (virtualRows.length === 0) return;
    const startRow = virtualRows[0].index;
    const endRow = virtualRows[virtualRows.length - 1].index;
    requestRange(startRow, endRow);
  }, [virtualRows, requestRange]);

  const collectPluginItems = useCallback(
    <T,>(method: "contextMenuItems" | "headerContextMenuItems", arg: T): MenuItem[] => {
      if (!plugins) return [];
      const items: MenuItem[] = [];
      for (const plugin of plugins) {
        const fn = plugin[method] as ((ctx: TableContext, arg: T) => MenuItem[]) | undefined;
        if (fn) items.push(...fn(ctx, arg));
      }
      return items;
    },
    [plugins, ctx],
  );

  const collectMenuItems = useCallback(
    (cell: import("../types.js").CellRef | null): MenuItem[] =>
      collectPluginItems("contextMenuItems", cell!),
    [collectPluginItems],
  );

  const collectHeaderMenuItems = useCallback(
    (column: import("../types.js").ResolvedColumn): MenuItem[] =>
      collectPluginItems("headerContextMenuItems", column),
    [collectPluginItems],
  );

  // Find which column index a clientX falls in
  const findColIndex = useCallback(
    (clientX: number): number => {
      const el = containerRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      let x = rect.left - el.scrollLeft;
      for (let i = 0; i < columns.length; i++) {
        x += columns[i].currentWidth;
        if (clientX < x) return i;
      }
      return columns.length - 1;
    },
    [columns, containerRef],
  );

  // Handle right-click — detect actual cell
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const target = e.target as HTMLElement;

      // Header right-click — detect via role="columnheader"
      const headerEl = target.closest('[role="columnheader"]');
      if (headerEl) {
        const field = headerEl.getAttribute("data-field");
        const column = field ? columns.find((c) => c.field === field) : null;
        if (column) {
          const items = collectHeaderMenuItems(column);
          ctx.emit("contextmenu", { x: e.clientX, y: e.clientY, column, items });
          return;
        }
      }

      const rowEl = target.closest("[data-index]");
      const rowIndex = rowEl ? Number(rowEl.getAttribute("data-index")) : -1;
      const row = rowIndex >= 0 ? (rows[rowIndex] ?? null) : null;

      const colIndex = findColIndex(e.clientX);
      const col = columns[colIndex];
      const cell =
        row && col
          ? {
              rowIndex,
              colIndex,
              rowId: getRowId(row, rowIndex),
              field: col.field,
              value: row[col.field] ?? null,
            }
          : null;

      // Auto-select right-clicked group row if not already in group selection
      if (cell && row && isGroupRow(row)) {
        const serialized = serializeGroupKey(row.__groupKey);
        if (!ctx.getLatest().selection.selectedGroups.has(serialized)) {
          ctx.setSelection({
            span: null,
            additionalSpans: [],
            selectedIds: new Set(),
            selectedCells: [],
            count: 0,
            asFilter: () => null,
            selectedGroups: new Set([serialized]),
            groupCount: 1,
          });
        }
      }

      // Set active cell for plugins that read ctx.activeCell
      if (cell) ctx.setActiveCell(cell);

      const items = collectMenuItems(cell);
      ctx.emit("contextmenu", { x: e.clientX, y: e.clientY, cell, items });
    },
    [rows, columns, findColIndex, collectMenuItems, collectHeaderMenuItems, ctx],
  );

  // Handle row click — emit cell:click for selection, group:click for groups
  const handleRowClick = useCallback(
    (row: Record<string, unknown>, index: number, e: React.MouseEvent) => {
      if (isGroupRow(row)) {
        // All group row clicks → selection (expand/collapse handled by chevron icon)
        const colIndex = findColIndex(e.clientX);
        ctx.emit("group:click", {
          rowIndex: index,
          colIndex,
          groupKey: row.__groupKey,
          ctrlKey: e.ctrlKey || e.metaKey,
          shiftKey: e.shiftKey,
        });
        return;
      }

      const colIndex = findColIndex(e.clientX);
      const col = columns[colIndex];

      // Emit cell:click for cell-level selection
      if (col) {
        ctx.emit("cell:click", {
          rowIndex: index,
          colIndex,
          field: col.field,
          value: row[col.field],
          row,
          ctrlKey: e.ctrlKey || e.metaKey,
          shiftKey: e.shiftKey,
        });
      }

      onRowClick?.(row);
    },
    [ctx, onRowClick, findColIndex, columns],
  );

  // Handle row double-click — start editing the cell
  const handleRowDoubleClick = useCallback(
    (row: Record<string, unknown>, index: number, e: React.MouseEvent) => {
      if (!ctx.editing) return;
      if (isGroupRow(row)) return;
      const colIndex = findColIndex(e.clientX);
      const col = columns[colIndex];
      if (!col || col.editable === false) return;
      const rowId = getRowId(row, index);
      ctx.editing.startEditing({
        rowIndex: index,
        colIndex,
        rowId,
        field: col.field,
        value: row[col.field],
      });
    },
    [ctx, findColIndex, columns],
  );

  const handleGroupToggle = useCallback(
    (gk: Record<string, unknown>, depth: number) => {
      ctx.emit("group:toggle", { groupKey: gk, depth });
    },
    [ctx],
  );

  return (
    <div
      role="grid"
      aria-rowcount={totalCount + 1}
      aria-colcount={columns.length}
      className={`${styles.root ?? ""} ${className ?? ""}`}
      style={{
        fontSize: density.fontSize,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: height === "100%" ? "100%" : undefined,
      }}
    >
      {/* Plugin renderAbove */}
      {plugins?.map((p, i) =>
        p.renderAbove ? <div key={`above-${p.name}-${i}`}>{p.renderAbove(ctx)}</div> : null,
      )}

      {/* Scroll container */}
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        tabIndex={0}
        aria-busy={isLoading}
        aria-live="polite"
        style={{
          height:
            height === "100%" ? undefined : typeof height === "number" ? `${height}px` : height,
          flex: height === "100%" ? 1 : undefined,
          overflow: "auto",
          position: "relative",
          userSelect: "none",
          WebkitUserSelect: "none",
          outline: "none",
        }}
        className={`utbl-scroll ${isLoading ? (styles.loading ?? "") : ""}`}
        onContextMenu={handleContextMenu}
        onClick={() => containerRef.current?.focus()}
      >
        {/* Header */}
        <div
          role="rowgroup"
          className={`utbl-header-row ${styles.header ?? ""}`}
          style={{
            display: "flex",
            position: "sticky",
            top: 0,
            zIndex: 10,
            minWidth: "fit-content",
          }}
        >
          <div role="row" style={{ display: "contents" }}>
            {columns.map((col) => (
              <HeaderRow
                key={col.field}
                column={col}
                sort={headerSort}
                onSort={ctx.setSort}
                onResize={setColumnWidth}
                styles={styles}
                px={density.px}
                py={density.py}
              />
            ))}
          </div>
        </div>

        {/* Virtual rows */}
        <div
          role="rowgroup"
          className="utbl-vlist"
          style={{ height: `${totalHeight}px`, position: "relative", minWidth: "fit-content" }}
        >
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index] ?? PLACEHOLDER_ROW;
            const isPlaceholder = row.__placeholder === true;
            const isGroup = !isPlaceholder && isGroupRow(row);
            // Check if entire row is selected (full-row span)
            const allSpans = selection.span
              ? [selection.span, ...selection.additionalSpans]
              : selection.additionalSpans;
            const isFullRowSelected =
              !isPlaceholder &&
              allSpans.some(
                (s) =>
                  isFullRowSpan(s, columns.length) && isInAnySpan(virtualRow.index, 0, selection),
              );
            const isGroupSelected =
              isGroup &&
              selection.selectedGroups.has(
                serializeGroupKey(row.__groupKey as Record<string, unknown>),
              );

            return (
              <VirtualRowItem
                key={virtualRow.key}
                row={row}
                virtualStart={virtualRow.start}
                virtualIndex={virtualRow.index}
                virtualKey={virtualRow.key}
                isEven={virtualRow.index % 2 === 0}
                isPlaceholder={isPlaceholder}
                isGroup={isGroup}
                isSelected={isFullRowSelected}
                isGroupSelected={isGroupSelected}
                columns={columns}
                groupBy={groupBy}
                styles={styles}
                density={density}
                selection={selection}
                ctx={ctx}
                rowStyleClass={!isPlaceholder ? (rowStyle?.(row, virtualRow.index) ?? "") : ""}
                measureElement={virtualizer.measureElement}
                onRowClick={handleRowClick}
                onRowDoubleClick={handleRowDoubleClick}
                onGroupToggle={handleGroupToggle}
              />
            );
          })}
        </div>

        {/* Empty state */}
        {displayCount === 0 && !isLoading && (
          <div className={styles.empty ?? ""} style={{ padding: "3rem", textAlign: "center" }}>
            No data
          </div>
        )}
      </div>

      {/* Plugin renderBelow */}
      {plugins?.map((p, i) =>
        p.renderBelow ? (
          <div
            key={`below-${p.name}-${i}`}
            className={(styles as Record<string, string | undefined>)[p.name] ?? ""}
          >
            {p.renderBelow(ctx)}
          </div>
        ) : null,
      )}

      {/* Footer — plugins with renderFooter replace the default content */}
      <div
        className={styles.footer ?? ""}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: `${density.py}px ${density.px}px`,
        }}
      >
        {renderFooter
          ? renderFooter({ totalCount, isLoading, selection })
          : (() => {
              const pluginFooter = plugins?.find((p) => p.renderFooter)?.renderFooter?.(ctx);
              return (
                pluginFooter ?? (
                  <span>{isLoading ? "Loading..." : `${totalCount.toLocaleString()} rows`}</span>
                )
              );
            })()}
      </div>

      {/* Plugin renderOverlay */}
      {plugins?.map((p, i) =>
        p.renderOverlay ? <div key={`overlay-${p.name}-${i}`}>{p.renderOverlay(ctx)}</div> : null,
      )}
    </div>
  );
}
