import { useCallback, useRef, useMemo } from 'react';
import { parseFilterExpr } from '@unify/table-core';
import type { ColumnType } from '@unify/table-core';
import type { BuiltInPanelProps } from './types.js';

const PLACEHOLDERS: Partial<Record<ColumnType, string>> = {
  number:    '>10  <=5  1..100  1,2,3  NULL',
  bigint:    '>10  <=5  1..100  1,2,3  NULL',
  string:    'USD%  %USD  a,b,c  !=x  NULL',
  date:      '>2024-01-01  today  today-7  2024-03  2024',
  timestamp: '>2024-01-01  today  today-7  2024-03  2024',
  boolean:   '= true  = false  NULL',
  enum:      'a,b,c  !=x  NULL',
};
const FALLBACK_PLACEHOLDER = '>x  <=x  a%  a,b,c  NULL';

export function FilterPanel({ ctx, columns, search, hiddenCols, filterValues, setFilterValues }: BuiltInPanelProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  // Build a field→ColumnType map from resolved columns (which have columnInfo)
  const typeMap = useMemo(() => {
    const map: Record<string, ColumnType> = {};
    for (const col of ctx.columns) {
      if (col.columnInfo) map[col.field] = col.columnInfo.mappedType;
    }
    return map;
  }, [ctx.columns]);

  const applyFilters = useCallback((values: Record<string, string>) => {
    const types = ctxRef.current.columns.reduce<Record<string, ColumnType>>((acc, col) => {
      if (col.columnInfo) acc[col.field] = col.columnInfo.mappedType;
      return acc;
    }, {});
    const exprs = Object.entries(values)
      .map(([field, value]) => parseFilterExpr(field, value, types[field]))
      .filter((expr): expr is NonNullable<typeof expr> => expr !== null);
    ctxRef.current.setFilters(exprs);
  }, []);

  const handleChange = useCallback((field: string, value: string) => {
    setFilterValues((prev) => {
      const next = { ...prev, [field]: value };
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => applyFilters(next), 300);
      return next;
    });
  }, [applyFilters, setFilterValues]);

  const filtered = columns.filter(
    (c) => !hiddenCols.has(c.field) && (c.label ?? c.field).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="utbl-panel-section utbl-space-y-sm">
      {filtered.map((col) => (
        <div key={col.field} className="utbl-field">
          <label className="utbl-field-label">{col.label ?? col.field}</label>
          <input
            type="text"
            className="utbl-input"
            placeholder={PLACEHOLDERS[typeMap[col.field]] ?? FALLBACK_PLACEHOLDER}
            value={filterValues[col.field] ?? ''}
            onChange={(e) => handleChange(col.field, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
