import { memo } from "react";
import type { ResolvedColumn, TableStyles, CellStyleValue } from "../types.js";
import type { Row } from "@unify/table-core";
import { buildPinStyle } from "../utils.js";

interface TableRowProps {
  column: ResolvedColumn;
  row: Row;
  styles: TableStyles;
  px: number;
  py: number;
  isCellSelected?: boolean;
  isActiveCell?: boolean;
}

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"];

// Cached Intl.NumberFormat instances — avoids allocating per cell per render
const fmtCache = new Map<string, Intl.NumberFormat>();
function getNumberFormat(key: string, opts: Intl.NumberFormatOptions): Intl.NumberFormat {
  let f = fmtCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat("en-US", opts);
    fmtCache.set(key, f);
  }
  return f;
}

export function formatValue(value: unknown, format?: string): string {
  if (value === null || value === undefined) return "";

  // Coerce BigInt (common from DuckDB aggregations) to number for formatting
  if (typeof value === "bigint") return formatValue(Number(value), format);

  // DuckDB-WASM returns large integers as typed arrays (Uint32Array, Int32Array, etc.)
  if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
    // Typed array from DuckDB — convert to a plain number.
    // For HUGEINT (Uint32Array(4)), reconstruct from little-endian 32-bit words.
    const arr = value as Uint32Array | Int32Array;
    if (arr.length === 4) {
      // 128-bit: combine low 64 bits (usually sufficient for display purposes)
      const lo = Number(arr[0]) + Number(arr[1]) * 2 ** 32;
      return formatValue(lo, format);
    }
    if (arr.length === 2) {
      const lo = Number(arr[0]) + Number(arr[1]) * 2 ** 32;
      return formatValue(lo, format);
    }
    if (arr.length === 1) {
      return formatValue(Number(arr[0]), format);
    }
    // Fallback: parse the string representation
    const n = Number(String(value));
    return formatValue(Number.isNaN(n) ? String(value) : n, format);
  }

  // Coerce numeric strings (some connectors serialize large numbers as strings)
  if (format && typeof value === "string" && value !== "" && !Number.isNaN(Number(value))) {
    return formatValue(Number(value), format);
  }

  if (format && typeof value === "number") {
    // currency — default USD
    if (format === "currency") {
      return getNumberFormat("currency:USD", { style: "currency", currency: "USD" }).format(value);
    }
    // currency:EUR, currency:GBP, etc.
    if (format.startsWith("currency:")) {
      const currency = format.slice(9);
      return getNumberFormat(`currency:${currency}`, { style: "currency", currency }).format(value);
    }
    if (format === "percent") {
      return getNumberFormat("percent", { style: "percent", minimumFractionDigits: 2 }).format(
        value,
      );
    }
    if (format === "number") {
      return getNumberFormat("number", {}).format(value);
    }
    if (format === "compact") {
      return getNumberFormat("compact", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value);
    }
    if (format === "bytes") {
      if (value === 0) return "0 B";
      const i = Math.min(
        Math.floor(Math.log(Math.abs(value)) / Math.log(1024)),
        BYTE_UNITS.length - 1,
      );
      const scaled = value / 1024 ** i;
      return `${scaled.toFixed(i === 0 ? 0 : 1)} ${BYTE_UNITS[i]}`;
    }
  }

  if (format === "boolean") {
    return value ? "\u2713" : "\u2717";
  }

  if (format && (format === "date" || format === "datetime" || format.startsWith("date:"))) {
    // Handle numeric timestamps (epoch ms) and Date objects
    const d =
      value instanceof Date
        ? value
        : typeof value === "number"
          ? new Date(value)
          : new Date(String(value));
    if (Number.isNaN(d.getTime())) return String(value);
    if (format === "date") return d.toLocaleDateString();
    if (format === "datetime") return d.toLocaleString();
    return d.toLocaleDateString("en-CA"); // ISO-like format
  }

  if (typeof value === "number") return getNumberFormat("default", {}).format(value);
  return String(value);
}

/**
 * Resolve a cellStyle value into a className + inlineStyle pair.
 * Accepts both the new `CellStyleResult` object format and legacy
 * `__style__...__end__` encoded strings for backwards compatibility.
 */
export function resolveCellStyle(raw: CellStyleValue): {
  className: string;
  inlineStyle: React.CSSProperties;
} {
  if (typeof raw === "object" && raw !== null) {
    return { className: raw.className ?? "", inlineStyle: raw.style ?? {} };
  }

  // Legacy string path: parse __style__...__end__ encoded prefix
  const str = raw ?? "";
  const inlineStyle: Record<string, string> = {};
  let className = str;

  const match = str.match(/^__style__(.+?)__end__\s*(.*)/);
  if (match) {
    const styleStr = match[1];
    className = match[2] ?? "";
    for (const pair of styleStr.split(";")) {
      const [k, v] = pair.split(":");
      if (k && v) inlineStyle[k.trim()] = v.trim();
    }
  }

  return { className, inlineStyle };
}

/** @deprecated Use resolveCellStyle instead */
export const parseCellStyle = resolveCellStyle;

export const TableRow = memo(function TableRow({
  column,
  row,
  styles,
  px,
  py,
  isCellSelected,
  isActiveCell,
}: TableRowProps) {
  const value = row[column.field];
  const rawStyle =
    typeof column.cellStyle === "function"
      ? column.cellStyle(value, row)
      : (column.cellStyle ?? "");
  const { className: dynamicClass, inlineStyle } = resolveCellStyle(rawStyle);

  const selectionStyle: React.CSSProperties = isActiveCell
    ? {
        outline: "2px solid #3b82f6",
        outlineOffset: -2,
        zIndex: column.pin ? 3 : 1,
        ...(column.pin ? {} : { position: "relative" }),
      }
    : isCellSelected
      ? { backgroundColor: "var(--row-selected-bg, #1e3a5f)" }
      : {};

  const pinStyle = buildPinStyle(column);

  const cellCss: React.CSSProperties = {
    width: column.currentWidth,
    minWidth: column.minWidth ?? 50,
    maxWidth: column.maxWidth,
    flexShrink: 0,
    flexGrow: 0,
    textAlign: column.align ?? "left",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    padding: `${py}px ${px}px`,
    ...pinStyle,
    ...inlineStyle,
    ...selectionStyle,
  };

  const ariaSelected = isCellSelected || isActiveCell || undefined;

  if (column.render) {
    return (
      <div
        role="gridcell"
        aria-selected={ariaSelected}
        className={`${styles.cell ?? ""} ${dynamicClass}`}
        style={cellCss}
      >
        {column.render(value, row)}
      </div>
    );
  }

  return (
    <div
      role="gridcell"
      aria-selected={ariaSelected}
      className={`${styles.cell ?? ""} ${dynamicClass}`}
      style={cellCss}
      title={value != null ? String(value) : ""}
    >
      {formatValue(value, column.format)}
    </div>
  );
});
