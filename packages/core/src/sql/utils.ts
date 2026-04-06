/** Returns true for numeric mapped types (number, bigint). */
export function isNumericType(mappedType: string): boolean {
  return mappedType === "number" || mappedType === "bigint";
}

/** Returns true for identity/key columns (id, _id suffixes) that should be excluded from display defaults. */
export function isIdentityColumn(name: string): boolean {
  const lower = name.toLowerCase();
  return lower === "id" || lower.endsWith("_id");
}

/** Pick the first numeric (non-identity) column from a column list. */
export function pickNumericColumn(columns: { name: string; mappedType: string }[]): string {
  const col = columns.find((c) => isNumericType(c.mappedType) && !isIdentityColumn(c.name));
  return col?.name ?? columns[0]?.name ?? "";
}

/** Pick the first string (non-identity) column from a column list, optionally skipping a specific name. */
export function pickStringColumn(
  columns: { name: string; mappedType: string }[],
  skip?: string,
): string {
  const col = columns.find(
    (c) => c.mappedType === "string" && c.name !== skip && !isIdentityColumn(c.name),
  );
  return col?.name ?? columns.find((c) => c.name !== skip)?.name ?? columns[0]?.name ?? "";
}

/** Quote a SQL identifier (column/table name) with double quotes. */
export function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/** Escape a string value for SQL (single-quote escaping). */
export function escapeString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/** Convert a JS value to a SQL literal. */
export function toSqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (value instanceof Date) return escapeString(value.toISOString());
  return escapeString(String(value));
}
