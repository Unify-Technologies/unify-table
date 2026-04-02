import { memo } from 'react';
import type { Row } from '@unify/table-core';
import type { ResolvedColumn, TableStyles, CellRef } from '../types.js';
import { formatValue, resolveCellStyle } from './TableRow.js';
import { buildPinStyle } from '../utils.js';
import type { DensityValues } from './Table.js';

interface GroupRowProps {
  row: Row;
  columns: ResolvedColumn[];
  groupBy: string[];
  styles: TableStyles;
  density: DensityValues;
  activeCell: CellRef | null;
  virtualIndex: number;
  isGroupSelected: boolean;
  onToggle: (groupKey: Record<string, unknown>, depth: number) => void;
}

export const GroupRow = memo(function GroupRow({
  row,
  columns,
  groupBy,
  styles,
  density,
  activeCell,
  virtualIndex,
  isGroupSelected,
  onToggle,
}: GroupRowProps) {
  const groupKey = row.__groupKey as Record<string, unknown>;
  const aggs = (row.__aggs as Record<string, unknown> | undefined) ?? {};
  const depth = (row.__depth as number) ?? 0;
  const expanded = row.__expanded as boolean;
  const groupedFields = new Set(groupBy);
  const groupField = groupBy[depth];
  const groupFieldCol = columns.find((c) => c.field === groupField);

  return columns.map((col, colIdx) => {
    const isGroupedCol = groupedFields.has(col.field);
    const aggValue = aggs[col.field];
    const isActiveCellHere = activeCell?.rowIndex === virtualIndex && activeCell?.colIndex === colIdx;
    const isCellInGroupSel = isGroupSelected && !isActiveCellHere;

    const activeCellStyle: React.CSSProperties = isActiveCellHere
      ? { outline: '2px solid #3b82f6', outlineOffset: -2, zIndex: col.pin ? 3 : 1, ...(col.pin ? {} : { position: 'relative' }) }
      : isCellInGroupSel
        ? { backgroundColor: 'var(--row-selected-bg, #1e3a5f)' }
        : {};

    const groupPinStyle = buildPinStyle(col);

    const cellStyle: React.CSSProperties = {
      width: col.currentWidth,
      minWidth: col.minWidth ?? 50,
      maxWidth: col.maxWidth,
      flexShrink: 0,
      flexGrow: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      padding: `${density.py}px ${density.px}px`,
      fontWeight: 600,
      textAlign: col.align ?? 'left',
      ...groupPinStyle,
      ...activeCellStyle,
    };

    if (colIdx === 0) {
      const groupValue = groupField ? groupKey[groupField] : undefined;
      const fmt = groupFieldCol?.format;
      return (
        <div key={col.field} className={`${styles.cell ?? ''} ${styles.groupRow ?? ''}`} style={{ ...cellStyle, paddingLeft: density.px + depth * 20, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            role="button"
            aria-expanded={expanded}
            aria-label={`Toggle group ${formatValue(groupValue, fmt) || 'unknown'}`}
            className={`utbl-group-toggle ${expanded ? 'utbl-group-toggle--expanded' : 'utbl-group-toggle--collapsed'}`}
            onClick={(e) => { e.stopPropagation(); onToggle(groupKey, depth); }}
            style={{ fontSize: '0.65em', transition: 'transform 0.15s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0, cursor: 'pointer', padding: 4, margin: -4, borderRadius: 3 }}
          >
            {'\u25B6'}
          </span>
          <span className="utbl-group-value" style={{ overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1, minWidth: 0 }}>
            {formatValue(groupValue, fmt) || '\u2014'}
          </span>
          <span className="utbl-group-count" style={{ opacity: 0.5, fontSize: '0.75em', flexShrink: 0 }}>
            ({(row.__groupCount as number).toLocaleString()})
          </span>
        </div>
      );
    }

    if (isGroupedCol) {
      return (
        <div key={col.field} className={`${styles.cell ?? ''} ${styles.groupRow ?? ''} utbl-cell-muted`} style={{ ...cellStyle, opacity: 0.25 }}>
          {'\u2014'}
        </div>
      );
    }

    if (aggValue !== undefined && aggValue !== null) {
      const rawCellStyle = typeof col.cellStyle === 'function' ? col.cellStyle(aggValue, row) : col.cellStyle ?? '';
      const { className: dynClass, inlineStyle } = resolveCellStyle(rawCellStyle);
      return (
        <div key={col.field} className={`${styles.cell ?? ''} ${styles.groupRow ?? ''} ${dynClass}`} style={{ ...cellStyle, ...inlineStyle }}>
          {formatValue(aggValue, col.format)}
        </div>
      );
    }

    return (
      <div key={col.field} className={`${styles.cell ?? ''} ${styles.groupRow ?? ''} utbl-cell-muted`} style={{ ...cellStyle, opacity: 0.25 }}>
        {'\u2014'}
      </div>
    );
  });
});
