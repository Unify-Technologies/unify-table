import { useCallback, useState } from 'react';
import { BUILT_IN_AGGS } from '@unify/table-core';
import { Eye, EyeOff } from 'lucide-react';
import type { BuiltInPanelProps, AggFn } from './types.js';
import { DragList } from './DragList.js';
import type { DragListItem } from './DragList.js';

export function ColumnsPanel({ ctx, columns: allColumns, search, hiddenCols, setHiddenCols, aggFns, setAggFns, groupByCols, showTooltip, hideTooltip }: BuiltInPanelProps) {
  // Build display list from all columns (including hidden), ordered by ctx.columns then hidden at bottom
  const visibleOrder = ctx.columns
    .filter((c) => c.field !== '__group__' && !groupByCols.includes(c.field))
    .map((c) => c.field);

  const hiddenFields = allColumns
    .filter((c) => hiddenCols.has(c.field) && !groupByCols.includes(c.field))
    .map((c) => c.field);

  // Deduplicate: hidden fields that already appear in visibleOrder (e.g. during async column resolution) are excluded
  const visibleSet = new Set(visibleOrder);
  const orderedFields = [...visibleOrder, ...hiddenFields.filter((f) => !visibleSet.has(f))];

  const colMap = new Map(allColumns.map((c) => [c.field, c]));

  const displayColumns = orderedFields
    .map((f) => colMap.get(f))
    .filter(
      (c): c is NonNullable<typeof c> =>
        c !== undefined &&
        (c.label ?? c.field).toLowerCase().includes(search.toLowerCase()),
    );

  const items: DragListItem[] = displayColumns.map((c) => ({
    key: c.field,
    label: c.label ?? c.field,
  }));

  const toggleCol = useCallback((field: string) => {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  }, [setHiddenCols]);

  const handleReorder = useCallback(
    (reordered: DragListItem[]) => {
      // Build the full order: __group__ + grouped columns stay in place, then reordered columns
      const allCols = ctx.columns;
      const nonDisplay = allCols.filter(
        (c) => c.field === '__group__' || groupByCols.includes(c.field),
      );
      const newOrder = [
        ...nonDisplay.map((c) => c.field),
        ...reordered.map((c) => c.key),
      ];
      ctx.setColumnOrder(newOrder);
    },
    [ctx, groupByCols],
  );

  return (
    <div className="utbl-panel-section">
      <DragList
        items={items}
        onReorder={handleReorder}
        renderLeading={(item) => (
          <EyeToggle
            hidden={hiddenCols.has(item.key)}
            onToggle={() => toggleCol(item.key)}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
        )}
        renderExtra={(item) => {
          const col = colMap.get(item.key);
          return (
            <span className="utbl-col-format" style={{ flexShrink: 0 }}>
              {col?.format ?? ''}
            </span>
          );
        }}
        renderTrailing={(item) => {
          const field = item.key;
          return (
            <select
              className="utbl-select"
              style={{ flexShrink: 0 }}
              value={aggFns[field] ?? ''}
              onChange={(e) => setAggFns((prev) => ({ ...prev, [field]: e.target.value as AggFn }))}
            >
              <option value="">{'\u2014'}</option>
              {BUILT_IN_AGGS.map((a: { key: string; label: string }) => (
                <option key={a.key} value={a.key}>{a.label}</option>
              ))}
            </select>
          );
        }}
      />
    </div>
  );
}

function EyeToggle({ hidden, onToggle, showTooltip, hideTooltip }: {
  hidden: boolean;
  onToggle: () => void;
  showTooltip: (e: React.MouseEvent, label: string) => void;
  hideTooltip: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  // Show the opposite icon on hover to preview the action
  const showClosed = hidden ? !hovered : hovered;
  const label = hidden ? 'Show column' : 'Hide column';
  return (
    <button
      onClick={() => { setHovered(false); hideTooltip(); onToggle(); }}
      onPointerEnter={(e) => { setHovered(true); showTooltip(e as unknown as React.MouseEvent, label); }}
      onPointerLeave={() => { setHovered(false); hideTooltip(); }}
      style={{
        flexShrink: 0,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        color: hidden ? 'var(--utbl-text-muted)' : 'var(--utbl-accent)',
        lineHeight: 0,
        display: 'flex',
        alignItems: 'center',
        opacity: hidden ? 0.4 : 1,
      }}
    >
      {showClosed
        ? <EyeOff size={12} strokeWidth={2.5} />
        : <Eye size={12} strokeWidth={2.5} />}
    </button>
  );
}
