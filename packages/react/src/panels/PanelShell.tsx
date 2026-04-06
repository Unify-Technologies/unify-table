import { useCallback, useEffect, useRef, useState } from "react";
import { parseFilterExpr } from "@unify/table-core";
import type { DisplayConfig, ColumnInfo, ColumnType } from "@unify/table-core";
import type { TableContext, ColumnDef } from "../types.js";
import type { PanelConfig, BuiltInPanel, BuiltInPanelProps, AggFn } from "./types.js";
import { FilterPanel } from "./FilterPanel.js";
import { GroupByPanel } from "./GroupByPanel.js";
import { ColumnsPanel } from "./ColumnsPanel.js";
import { ExportPanel } from "./ExportPanel.js";
import { DebugPanel } from "./DebugPanel.js";
import { DisplayPanel } from "./DisplayPanel.js";
import { Filter, LayoutGrid, Columns2, Download, Bug, Monitor, Eraser, Search } from "lucide-react";

/* ── Built-in panel registry ────────────────────────────── */

interface BuiltInEntry {
  key: BuiltInPanel;
  label: string;
  icon: React.ReactNode;
  render: (props: BuiltInPanelProps) => React.ReactNode;
}

const BUILT_IN_PANELS: BuiltInEntry[] = [
  {
    key: "columns",
    label: "Columns",
    icon: <Columns2 size={12} strokeWidth={2.5} />,
    render: (props) => <ColumnsPanel {...props} />,
  },
  {
    key: "filters",
    label: "Filters",
    icon: <Filter size={12} strokeWidth={2.5} />,
    render: (props) => <FilterPanel {...props} />,
  },
  {
    key: "groupBy",
    label: "Group By",
    icon: <LayoutGrid size={12} strokeWidth={2.5} />,
    render: (props) => <GroupByPanel {...props} />,
  },
  {
    key: "displays",
    label: "Displays",
    icon: <Monitor size={12} strokeWidth={2.5} />,
    render: () => null /* handled separately */,
  },
  {
    key: "export",
    label: "Export",
    icon: <Download size={12} strokeWidth={2.5} />,
    render: () => null,
  },
  { key: "debug", label: "Debug", icon: <Bug size={12} strokeWidth={2.5} />, render: () => null },
];

/* ── PanelShell ─────────────────────────────────────────── */

export interface PanelShellProps {
  ctx: TableContext;
  columns: ColumnDef[];
  panels: PanelConfig[];
  hiddenCols: Set<string>;
  setHiddenCols: React.Dispatch<React.SetStateAction<Set<string>>>;
  groupByCols: string[];
  setGroupByCols: React.Dispatch<React.SetStateAction<string[]>>;
  aggFns: Record<string, AggFn>;
  setAggFns: React.Dispatch<React.SetStateAction<Record<string, AggFn>>>;
  // Filter value persistence
  initialFilterValues?: Record<string, string>;
  onFilterValuesChange?: (values: Record<string, string>) => void;
  // Display-related props
  displays?: DisplayConfig[];
  activeDisplay?: string | null;
  onActivateDisplay?: (id: string | null) => void;
  onAddDisplay?: (type: string) => void;
  onRemoveDisplay?: (id: string) => void;
  onDisplayConfigChange?: (id: string, config: Record<string, unknown>) => void;
  schemaColumns?: ColumnInfo[];
}

export function PanelShell({
  ctx,
  columns,
  panels,
  hiddenCols,
  setHiddenCols,
  groupByCols,
  setGroupByCols,
  aggFns,
  setAggFns,
  initialFilterValues,
  onFilterValuesChange,
  displays = [],
  activeDisplay = null,
  onActivateDisplay,
  onAddDisplay,
  onRemoveDisplay,
  onDisplayConfigChange,
  schemaColumns = [],
}: PanelShellProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    initialFilterValues ?? {},
  );

  // Apply initial filter values once columns (with type info) are available
  const appliedInitialFilters = useRef(false);
  useEffect(() => {
    if (appliedInitialFilters.current) return;
    if (!initialFilterValues || Object.keys(initialFilterValues).length === 0) return;
    // Wait until columns have type info (columnInfo) available
    const hasTypes = ctx.columns.some((c) => c.columnInfo);
    if (!hasTypes) return;
    appliedInitialFilters.current = true;
    const types = ctx.columns.reduce<Record<string, ColumnType>>((acc, col) => {
      if (col.columnInfo) acc[col.field] = col.columnInfo.mappedType;
      return acc;
    }, {});
    const exprs = Object.entries(initialFilterValues)
      .map(([field, value]) => parseFilterExpr(field, value, types[field]))
      .filter((expr): expr is NonNullable<typeof expr> => expr !== null);
    if (exprs.length > 0) ctx.setFilters(exprs);
  }, [ctx.columns, ctx.setFilters, initialFilterValues]);

  const wrappedSetFilterValues: typeof setFilterValues = useCallback(
    (action) => {
      setFilterValues((prev) => {
        const next = typeof action === "function" ? action(prev) : action;
        onFilterValuesChange?.(next);
        return next;
      });
    },
    [onFilterValuesChange],
  );

  const handleClearFilters = useCallback(() => {
    wrappedSetFilterValues({});
    ctx.setFilters([]);
  }, [ctx, wrappedSetFilterValues]);

  const handleClearGroupBy = useCallback(() => {
    setGroupByCols([]);
  }, [setGroupByCols]);

  const toggle = useCallback((key: string) => {
    setActiveKey((prev) => (prev === key ? null : key));
    setSearch("");
  }, []);

  type ResolvedEntry =
    | BuiltInEntry
    | {
        key: string;
        label: string;
        icon: React.ReactNode;
        render: null;
        custom: { render: (ctx: TableContext) => React.ReactNode };
      };

  const resolved: ResolvedEntry[] = panels
    .map((p): ResolvedEntry | null => {
      if (typeof p === "string") {
        return BUILT_IN_PANELS.find((b) => b.key === p) ?? null;
      }
      return {
        key: p.key,
        label: p.label,
        icon: p.icon ? <p.icon size={12} strokeWidth={2.5} /> : null,
        render: null,
        custom: p,
      };
    })
    .filter((x): x is ResolvedEntry => x !== null);

  const panelOpen = activeKey !== null;
  const activeEntry = panelOpen ? resolved.find((e) => e.key === activeKey) : null;

  const [tooltip, setTooltip] = useState<{
    label: string;
    top: number;
    right?: number;
    left?: number;
  } | null>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showTooltip = useCallback(
    (e: React.MouseEvent, label: string, pos?: { top: number; left: number }) => {
      clearTimeout(tooltipTimer.current);
      if (pos) {
        setTooltip({ label, top: pos.top, left: pos.left });
      } else {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setTooltip({
          label,
          top: rect.top + rect.height / 2,
          right: window.innerWidth - rect.left + 6,
        });
      }
    },
    [],
  );

  const hideTooltip = useCallback(() => {
    tooltipTimer.current = setTimeout(() => setTooltip(null), 50);
  }, []);

  const getBadge = (key: string): { type: "dot" | "count"; value?: number } | null => {
    switch (key) {
      case "columns":
        return hiddenCols.size > 0 ? { type: "dot" } : null;
      case "filters": {
        const count = Object.values(filterValues).filter(Boolean).length;
        return count > 0 ? { type: "count", value: count } : null;
      }
      case "groupBy":
        return groupByCols.length > 0 ? { type: "dot" } : null;
      case "displays":
        return activeDisplay != null ? { type: "dot" } : null;
      default:
        return null;
    }
  };

  const sharedProps: BuiltInPanelProps = {
    ctx,
    columns,
    search,
    hiddenCols,
    setHiddenCols,
    filterValues,
    setFilterValues: wrappedSetFilterValues,
    groupByCols,
    setGroupByCols,
    aggFns,
    setAggFns,
    showTooltip,
    hideTooltip,
  };

  return (
    <div className="utbl-panel">
      {/* Tab strip — icon only, tooltip on hover */}
      <div className="utbl-tab-strip">
        {resolved.map((entry) => {
          const badge = getBadge(entry.key);
          return (
            <button
              key={entry.key}
              className="utbl-tab-btn"
              data-active={activeKey === entry.key}
              onMouseEnter={(e) => showTooltip(e, entry.label)}
              onMouseLeave={hideTooltip}
              onClick={() => toggle(entry.key)}
            >
              {entry.icon}
              {badge && (
                <span
                  className={
                    badge.type === "count"
                      ? "utbl-tab-badge utbl-tab-badge--count"
                      : "utbl-tab-badge utbl-tab-badge--dot"
                  }
                >
                  {badge.type === "count" ? badge.value : null}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Fixed tooltip */}
      {tooltip && (
        <div
          className="utbl-tooltip--fixed"
          style={{
            top: tooltip.top,
            right: tooltip.right,
            left: tooltip.left,
            transform: tooltip.left != null ? "translateY(-100%)" : "translateY(-50%)",
          }}
        >
          {tooltip.label}
        </div>
      )}

      {/* Content */}
      {panelOpen && activeEntry && (
        <div className="utbl-panel-content">
          {/* Search — only for panels that filter by column name */}
          {(activeKey === "filters" ||
            activeKey === "groupBy" ||
            activeKey === "columns" ||
            activeKey === "displays") && (
            <div className="utbl-panel-search" style={{ position: "relative" }}>
              <Search
                size={10}
                strokeWidth={2.5}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--utbl-text-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                className="utbl-input"
                style={{ paddingLeft: 24 }}
                placeholder={activeKey === "displays" ? "Search displays..." : "Search..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          {/* Panel header: icon + title + optional clear */}
          <div className="utbl-panel-header">
            {activeEntry.icon}
            <span>{activeEntry.label}</span>
            {activeKey === "filters" && Object.values(filterValues).some(Boolean) && (
              <button
                className="utbl-panel-header-clear"
                onClick={handleClearFilters}
                onMouseEnter={(e) => showTooltip(e, "Clear filters")}
                onMouseLeave={hideTooltip}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 2,
                  color: "var(--utbl-text-muted)",
                  lineHeight: 0,
                  borderRadius: "var(--utbl-radius, 3px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Eraser size={10} strokeWidth={2.5} />
              </button>
            )}
            {activeKey === "groupBy" && groupByCols.length > 0 && (
              <button
                className="utbl-panel-header-clear"
                onClick={handleClearGroupBy}
                onMouseEnter={(e) => showTooltip(e, "Clear grouping")}
                onMouseLeave={hideTooltip}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 2,
                  color: "var(--utbl-text-muted)",
                  lineHeight: 0,
                  borderRadius: "var(--utbl-radius, 3px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Eraser size={10} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Active panel */}
          {resolved.map((entry) => {
            if (entry.key !== activeKey) return null;

            if (entry.key === "displays") {
              return (
                <DisplayPanel
                  key={entry.key}
                  displays={displays}
                  activeDisplay={activeDisplay}
                  onActivate={onActivateDisplay ?? (() => {})}
                  onAdd={onAddDisplay ?? (() => {})}
                  onRemove={onRemoveDisplay ?? (() => {})}
                  onConfigChange={onDisplayConfigChange ?? (() => {})}
                  schemaColumns={schemaColumns}
                  search={search}
                  showTooltip={showTooltip}
                  hideTooltip={hideTooltip}
                />
              );
            }

            if (entry.key === "export") {
              return <ExportPanel key={entry.key} ctx={ctx} />;
            }

            if (entry.key === "debug") {
              return <DebugPanel key={entry.key} ctx={ctx} />;
            }

            if ("custom" in entry && entry.custom) {
              return <div key={entry.key}>{entry.custom.render(ctx)}</div>;
            }

            if (entry.render) {
              return <div key={entry.key}>{entry.render(sharedProps)}</div>;
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}
