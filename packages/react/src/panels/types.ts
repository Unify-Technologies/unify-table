import type { ReactNode } from "react";
import type { TableContext, ColumnDef } from "../types.js";

/** Built-in panel identifiers. */
export type BuiltInPanel = "filters" | "groupBy" | "columns" | "export" | "debug" | "displays";

/** Descriptor for a custom panel section. */
export interface PanelDescriptor {
  key: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  render: (ctx: TableContext) => ReactNode;
}

/** A panel entry — either a built-in name or a custom descriptor. */
export type PanelConfig = BuiltInPanel | PanelDescriptor;

/** Aggregation function type. */
export type AggFn =
  | "sum"
  | "avg"
  | "count"
  | "min"
  | "max"
  | "count_distinct"
  | "median"
  | "first"
  | "last"
  | "any"
  | "mode"
  | "stddev"
  | "variance"
  | "string_agg"
  | "";

/** Props shared by all built-in panel components. */
export interface BuiltInPanelProps {
  ctx: TableContext;
  columns: ColumnDef[];
  search: string;
  hiddenCols: Set<string>;
  setHiddenCols: React.Dispatch<React.SetStateAction<Set<string>>>;
  filterValues: Record<string, string>;
  setFilterValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  groupByCols: string[];
  setGroupByCols: React.Dispatch<React.SetStateAction<string[]>>;
  aggFns: Record<string, AggFn>;
  setAggFns: React.Dispatch<React.SetStateAction<Record<string, AggFn>>>;
  showTooltip: (e: React.MouseEvent, label: string, pos?: { top: number; left: number }) => void;
  hideTooltip: () => void;
}
