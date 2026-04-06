import type { SqlFragment, ColumnType } from "../types.js";
import { quoteIdent, toSqlLiteral } from "./utils.js";

function fragment(sql: string): SqlFragment {
  return { sql, toString: () => sql };
}

// --- Comparison filters ---

export function eq(field: string, value: unknown): SqlFragment {
  if (value === null || value === undefined) return fragment(`${quoteIdent(field)} IS NULL`);
  return fragment(`${quoteIdent(field)} = ${toSqlLiteral(value)}`);
}

export function neq(field: string, value: unknown): SqlFragment {
  if (value === null || value === undefined) return fragment(`${quoteIdent(field)} IS NOT NULL`);
  return fragment(`${quoteIdent(field)} != ${toSqlLiteral(value)}`);
}

export function gt(field: string, value: unknown): SqlFragment {
  return fragment(`${quoteIdent(field)} > ${toSqlLiteral(value)}`);
}

export function gte(field: string, value: unknown): SqlFragment {
  return fragment(`${quoteIdent(field)} >= ${toSqlLiteral(value)}`);
}

export function lt(field: string, value: unknown): SqlFragment {
  return fragment(`${quoteIdent(field)} < ${toSqlLiteral(value)}`);
}

export function lte(field: string, value: unknown): SqlFragment {
  return fragment(`${quoteIdent(field)} <= ${toSqlLiteral(value)}`);
}

// --- Text filters ---

export function contains(field: string, value: string): SqlFragment {
  const escaped = value.replace(/'/g, "''").replace(/%/g, "\\%").replace(/_/g, "\\_");
  return fragment(`${quoteIdent(field)} ILIKE '%${escaped}%' ESCAPE '\\'`);
}

export function startsWith(field: string, value: string): SqlFragment {
  const escaped = value.replace(/'/g, "''").replace(/%/g, "\\%").replace(/_/g, "\\_");
  return fragment(`${quoteIdent(field)} ILIKE '${escaped}%' ESCAPE '\\'`);
}

export function endsWith(field: string, value: string): SqlFragment {
  const escaped = value.replace(/'/g, "''").replace(/%/g, "\\%").replace(/_/g, "\\_");
  return fragment(`${quoteIdent(field)} ILIKE '%${escaped}' ESCAPE '\\'`);
}

// --- Set / range filters ---

export function oneOf(field: string, values: unknown[]): SqlFragment {
  if (values.length === 0) return fragment("FALSE");
  const literals = values.map(toSqlLiteral).join(", ");
  return fragment(`${quoteIdent(field)} IN (${literals})`);
}

export function between(field: string, low: unknown, high: unknown): SqlFragment {
  return fragment(`${quoteIdent(field)} BETWEEN ${toSqlLiteral(low)} AND ${toSqlLiteral(high)}`);
}

// --- Null checks ---

export function isNull(field: string): SqlFragment {
  return fragment(`${quoteIdent(field)} IS NULL`);
}

export function isNotNull(field: string): SqlFragment {
  return fragment(`${quoteIdent(field)} IS NOT NULL`);
}

// --- Combinators ---

export function and(...clauses: SqlFragment[]): SqlFragment {
  if (clauses.length === 0) return fragment("TRUE");
  if (clauses.length === 1) return clauses[0];
  return fragment(`(${clauses.map((c) => c.sql).join(" AND ")})`);
}

export function or(...clauses: SqlFragment[]): SqlFragment {
  if (clauses.length === 0) return fragment("FALSE");
  if (clauses.length === 1) return clauses[0];
  return fragment(`(${clauses.map((c) => c.sql).join(" OR ")})`);
}

export function not(clause: SqlFragment): SqlFragment {
  return fragment(`NOT (${clause.sql})`);
}

// --- Raw SQL escape hatch ---

export function raw(sql: string): SqlFragment {
  return fragment(sql);
}

// --- Rich text filter parser ---

/**
 * Parse a free-form filter string into a SqlFragment for a given field.
 * Optionally accepts a `columnType` hint for type-aware coercion.
 *
 * Supported syntax:
 *   >= 10, <= 10, > 10, < 10, != value, = value   — comparison operators
 *   10..100                                         — between (inclusive)
 *   val1,val2,val3                                  — oneOf (IN)
 *   USD%                                            — startsWith
 *   %USD                                            — endsWith
 *   %USD%                                           — contains (explicit)
 *   NULL, !NULL                                     — null checks
 *   plain text                                      — contains (default)
 *
 * Date/timestamp columns additionally support:
 *   today, yesterday, tomorrow                      — relative day
 *   today-7, today+30                               — relative offset in days
 *   2024-01                                         — whole month (BETWEEN 1st..last day)
 *   2024                                            — whole year  (BETWEEN Jan 1..Dec 31)
 *   All comparison / range operators work with date literals too.
 */
export function parseFilterExpr(
  field: string,
  input: string,
  columnType?: ColumnType,
): SqlFragment | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  const isDateCol = columnType === "date" || columnType === "timestamp";

  // NULL / !NULL
  if (trimmed.toUpperCase() === "NULL") return isNull(field);
  if (trimmed.toUpperCase() === "!NULL") return isNotNull(field);

  // Date-specific: relative keywords & partial dates (before operator parsing so `> today-7` works)
  if (isDateCol) {
    // Whole-month shorthand: 2024-01 → BETWEEN first..last day
    const monthMatch = trimmed.match(/^(\d{4})-(\d{2})$/);
    if (monthMatch) {
      const [, y, m] = monthMatch;
      const first = `${y}-${m}-01`;
      const last = lastDayOfMonth(Number(y), Number(m));
      return between(field, first, last);
    }

    // Whole-year shorthand: 2024 → BETWEEN Jan 1..Dec 31
    const yearMatch = trimmed.match(/^(\d{4})$/);
    if (yearMatch) {
      return between(field, `${yearMatch[1]}-01-01`, `${yearMatch[1]}-12-31`);
    }
  }

  // Comparison operators: >=, <=, !=, >, <, =
  const cmpMatch = trimmed.match(/^(>=|<=|!=|>|<|=)\s*(.+)$/);
  if (cmpMatch) {
    const [, op, rawVal] = cmpMatch;
    const value = coerce(rawVal.trim(), isDateCol);
    switch (op) {
      case ">=":
        return gte(field, value);
      case "<=":
        return lte(field, value);
      case ">":
        return gt(field, value);
      case "<":
        return lt(field, value);
      case "!=":
        return neq(field, value);
      case "=":
        return eq(field, value);
    }
  }

  // Range: 10..100 or 2024-01-01..2024-12-31
  const rangeMatch = trimmed.match(/^(.+?)\.\.(.+)$/);
  if (rangeMatch) {
    const lo = coerce(rangeMatch[1].trim(), isDateCol);
    const hi = coerce(rangeMatch[2].trim(), isDateCol);
    return between(field, lo, hi);
  }

  // Comma-separated: val1,val2,val3 (only if no wildcards present)
  if (trimmed.includes(",") && !trimmed.includes("%")) {
    const values = trimmed.split(",").map((v) => coerce(v.trim(), isDateCol));
    return oneOf(field, values);
  }

  // Wildcards: USD%, %USD, %USD%
  if (trimmed.includes("%")) {
    const startsW = trimmed.endsWith("%") && !trimmed.startsWith("%");
    const endsW = trimmed.startsWith("%") && !trimmed.endsWith("%");
    if (startsW) return startsWith(field, trimmed.slice(0, -1));
    if (endsW) return endsWith(field, trimmed.slice(1));
    const inner = trimmed.replace(/^%/, "").replace(/%$/, "");
    return contains(field, inner);
  }

  // Date column: treat bare input as a date-aware value → exact match or CAST comparison
  if (isDateCol) {
    const resolved = resolveRelativeDate(trimmed);
    if (resolved) return eq(field, resolved);

    // If it looks like a date literal, use eq
    if (ISO_DATE_RE.test(trimmed) || ISO_DATETIME_RE.test(trimmed)) {
      return eq(field, trimmed);
    }
  }

  // Default: contains
  return contains(field, trimmed);
}

// --- Date helpers ---

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;
const RELATIVE_DATE_RE = /^(today|yesterday|tomorrow)([+-]\d+)?$/i;

/** Resolve relative date keywords to an ISO date string, or null. */
function resolveRelativeDate(value: string): string | null {
  const m = value.match(RELATIVE_DATE_RE);
  if (!m) return null;

  const now = new Date();
  const base = m[1].toLowerCase();
  let d = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (base === "yesterday") d.setDate(d.getDate() - 1);
  else if (base === "tomorrow") d.setDate(d.getDate() + 1);

  if (m[2]) d.setDate(d.getDate() + Number(m[2]));

  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Return YYYY-MM-DD for the last day of the given month (1-indexed). */
function lastDayOfMonth(year: number, month: number): string {
  // day 0 of next month = last day of this month
  const day = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Coerce a string value. When `dateHint` is true, resolves relative dates and keeps date strings. */
function coerce(value: string, dateHint: boolean): string | number {
  if (dateHint) {
    const resolved = resolveRelativeDate(value);
    if (resolved) return resolved;
    // Keep date-like strings as strings (don't Number('2024') → 2024)
    if (
      ISO_DATE_RE.test(value) ||
      ISO_DATETIME_RE.test(value) ||
      /^\d{4}$/.test(value) ||
      /^\d{4}-\d{2}$/.test(value)
    ) {
      return value;
    }
  }
  const n = Number(value);
  return !Number.isNaN(n) && value.length > 0 ? n : value;
}
