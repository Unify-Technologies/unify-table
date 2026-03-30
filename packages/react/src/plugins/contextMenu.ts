import { useState, useEffect, useRef, createElement } from 'react';
import type { TablePlugin, TableContext, MenuItem, ResolvedColumn } from '../types.js';
import { quoteIdent } from '@unify/table-core';
import { detectIdColumn, downloadBlob } from '../utils.js';
import { Copy, Table2, FileText, Braces, Database, ArrowUpDown, ArrowUp, ArrowDown, Eraser, Layers } from 'lucide-react';

type MenuItemFactory = (ctx: TableContext) => MenuItem[];

interface MenuState {
  open: boolean;
  x: number;
  y: number;
  items: MenuItem[];
}

const ICONS = {
  copy: createElement(Copy, { size: 14 }),
  selectAll: createElement(Table2, { size: 14 }),
  csv: createElement(FileText, { size: 14 }),
  json: createElement(Braces, { size: 14 }),
  parquet: createElement(Database, { size: 14 }),
};

function spanDims(ctx: TableContext): { rows: number; cols: number } {
  const sel = ctx.selection;
  if (!sel.span) return { rows: 0, cols: 0 };
  const allSpans = [sel.span, ...sel.additionalSpans];
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
  for (const s of allSpans) {
    minR = Math.min(minR, s.anchor.row, s.focus.row);
    maxR = Math.max(maxR, s.anchor.row, s.focus.row);
    minC = Math.min(minC, s.anchor.col, s.focus.col);
    maxC = Math.max(maxC, s.anchor.col, s.focus.col);
  }
  return { rows: maxR - minR + 1, cols: maxC - minC + 1 };
}

function fmt(n: number): string {
  return n.toLocaleString();
}

function exportSourceItems(ctx: TableContext, format: 'csv' | 'json' | 'parquet'): MenuItem[] {
  const live = ctx.getLatest();
  const totalCols = live.columns.length;
  const { rows: selRows, cols: selCols } = spanDims(live);
  const hasSel = live.selection.count > 0;

  const doExport = async (selOnly: boolean) => {
    const l = ctx.getLatest();
    const table = l.table;
    const filename = selOnly ? `${table}_selection.${format}` : `${table}.${format}`;
    if (selOnly && l.selection.selectedIds.size > 0) {
      const ids = [...l.selection.selectedIds];
      const idCol = detectIdColumn(l.columns);
      const idList = ids.map((id) => { const n = Number(id); return Number.isNaN(n) ? `'${String(id).replace(/'/g, "''")}'` : String(n); }).join(',');
      const tmp = `__ctx_export_${Date.now()}`;
      await l.engine.execute(`CREATE TEMP TABLE ${quoteIdent(tmp)} AS SELECT * FROM ${quoteIdent(table)} WHERE ${quoteIdent(idCol)} IN (${idList})`);
      const blob = await l.engine.exportBlob(tmp, format);
      await l.engine.execute(`DROP TABLE IF EXISTS ${quoteIdent(tmp)}`);
      downloadBlob(blob, filename);
    } else {
      const blob = await l.engine.exportBlob(table, format);
      downloadBlob(blob, filename);
    }
  };

  const items: MenuItem[] = [
    { label: `All rows  ${fmt(live.totalCount)} \u00D7 ${totalCols}`, action: () => doExport(false) },
  ];
  if (hasSel) {
    items.push({ label: `Selection  ${fmt(selRows)} \u00D7 ${selCols}`, action: () => doExport(true) });
  }
  if (live.filters.length > 0) {
    items.push({ label: `Filtered  ${fmt(live.totalCount)} \u00D7 ${totalCols}`, action: () => doExport(false) });
  }
  return items;
}

function defaultItems(ctx: TableContext): MenuItem[] {
  const sel = ctx.getLatest().selection;
  const hasSel = sel.count > 0 || sel.groupCount > 0;
  const items: MenuItem[] = [];

  items.push({
    label: 'Copy',
    shortcut: '\u2318C',
    icon: ICONS.copy,
    disabled: !hasSel,
    action: () => {
      const live = ctx.getLatest();
      const { selection, rows, columns } = live;
      if (selection.selectedCells.length > 0) {
        const byRow = new Map<number, Set<string>>();
        for (const c of selection.selectedCells) {
          if (!byRow.has(c.rowIndex)) byRow.set(c.rowIndex, new Set());
          byRow.get(c.rowIndex)!.add(c.field);
        }
        const headers = columns.map((c) => c.field).join('\t');
        const body = [...byRow.entries()]
          .sort(([a], [b]) => a - b)
          .map(([idx]) => { const row = rows[idx]; return row ? columns.map((c) => row[c.field] ?? '').join('\t') : ''; })
          .join('\n');
        navigator.clipboard.writeText(`${headers}\n${body}`);
      }
    },
  });

  items.push({
    label: 'Select all',
    shortcut: '\u2318A',
    icon: ICONS.selectAll,
    action: () => {
      const live = ctx.getLatest();
      const lastRow = live.rows.length - 1;
      const lastCol = live.columns.length - 1;
      if (lastRow >= 0 && lastCol >= 0) {
        live.setSelection({
          span: { anchor: { row: 0, col: 0 }, focus: { row: lastRow, col: lastCol } },
          additionalSpans: [], selectedIds: new Set(), selectedCells: [], count: 0, asFilter: () => null, selectedGroups: new Set(), groupCount: 0,
        });
      }
    },
  });

  items.push({ label: '', action: () => {}, type: 'separator' });

  // Export items with submenus
  items.push({
    label: 'Export as CSV',
    icon: ICONS.csv,
    action: () => {},
    children: exportSourceItems(ctx, 'csv'),
  });
  items.push({
    label: 'Export as JSON',
    icon: ICONS.json,
    action: () => {},
    children: exportSourceItems(ctx, 'json'),
  });
  items.push({
    label: 'Export as Parquet',
    icon: ICONS.parquet,
    action: () => {},
    children: exportSourceItems(ctx, 'parquet'),
  });

  return items;
}

function defaultHeaderItems(ctx: TableContext, column: ResolvedColumn): MenuItem[] {
  const live = ctx.getLatest();
  const items: MenuItem[] = [];
  const currentSort = live.sort.find((s) => s.field === column.field);
  const isSortable = column.sortable !== false;

  if (isSortable) {
    items.push({
      label: 'Sort',
      icon: createElement(ArrowUpDown, { size: 14 }),
      action: () => {},
      children: [
        {
          label: 'Ascending',
          icon: createElement(ArrowUp, { size: 14 }),
          disabled: currentSort?.dir === 'asc',
          action: () => {
            const l = ctx.getLatest();
            const existing = l.sort.filter((s) => s.field !== column.field);
            l.setSort([...existing, { field: column.field, dir: 'asc' }]);
          },
        },
        {
          label: 'Descending',
          icon: createElement(ArrowDown, { size: 14 }),
          disabled: currentSort?.dir === 'desc',
          action: () => {
            const l = ctx.getLatest();
            const existing = l.sort.filter((s) => s.field !== column.field);
            l.setSort([...existing, { field: column.field, dir: 'desc' }]);
          },
        },
        {
          label: 'Clear',
          icon: createElement(Eraser, { size: 14 }),
          disabled: !currentSort,
          action: () => {
            const l = ctx.getLatest();
            l.setSort(l.sort.filter((s) => s.field !== column.field));
          },
        },
      ],
    });
    items.push({ label: '', action: () => {}, type: 'separator' });
  }

  const isGrouped = live.groupBy.includes(column.field);
  items.push({
    label: isGrouped ? 'Remove Grouping' : 'Group by this Column',
    icon: createElement(Layers, { size: 14 }),
    action: () => {
      const l = ctx.getLatest();
      if (isGrouped) {
        l.setGroupBy(l.groupBy.filter((f) => f !== column.field));
      } else {
        l.setGroupBy([...l.groupBy, column.field]);
      }
    },
  });

  items.push({ label: '', action: () => {}, type: 'separator' });

  items.push({
    label: 'Copy Column Name',
    icon: ICONS.copy,
    action: () => {
      navigator.clipboard.writeText(column.label ?? column.field);
    },
  });

  return items;
}

/* ═══════════════════════════════════════════════════════════ */

const menuStyle: React.CSSProperties = {
  position: 'absolute', minWidth: 220,
  backgroundColor: 'var(--utbl-surface)', border: '1px solid var(--utbl-border)',
  borderRadius: 8, padding: '4px 0', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  fontFamily: 'system-ui, sans-serif', fontSize: '0.8rem',
};

function MenuPanel({ items, x, y, onClose }: { items: MenuItem[]; x: number | string; y: number | string; onClose: () => void }): React.ReactElement {
  const [hovered, setHovered] = useState(-1);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  return createElement('div', {
    style: { ...menuStyle, left: x, top: y },
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
  },
    items.map((item, i) => {
      if (item.type === 'separator') {
        return createElement('div', { key: `sep-${i}`, style: { height: 1, backgroundColor: 'var(--utbl-border)', margin: '4px 8px' } });
      }
      const hasChildren = item.children && item.children.length > 0;
      return createElement('div', {
        key: `${item.label}-${i}`,
        ref: (el: HTMLElement | null) => { itemRefs.current[i] = el; },
        style: { position: 'relative' as const },
        onMouseEnter: () => setHovered(i),
        onMouseLeave: () => setHovered(-1),
      }, [
        createElement('button', {
          key: 'btn',
          disabled: item.disabled,
          style: {
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '6px 12px', border: 'none',
            background: hovered === i ? 'var(--utbl-surface-alt)' : 'none',
            color: item.disabled ? 'var(--utbl-text-muted)' : item.danger ? '#ef4444' : 'var(--utbl-text)',
            cursor: item.disabled ? 'default' : 'pointer', textAlign: 'left',
            fontSize: 'inherit', fontFamily: 'inherit', opacity: item.disabled ? 0.5 : 1,
          },
          onClick: () => { if (!item.disabled && !hasChildren) { item.action(); onClose(); } },
        }, [
          createElement('span', { key: 'icon', style: { display: 'flex', opacity: 0.5, width: 14, flexShrink: 0 } }, item.icon ?? null),
          createElement('span', { key: 'label', style: { flex: 1 } }, item.label),
          item.shortcut ? createElement('span', { key: 'sc', style: { opacity: 0.3, fontSize: '0.7em', marginLeft: 16 } }, item.shortcut) : null,
          hasChildren ? createElement('span', { key: 'arrow', style: { opacity: 0.4, marginLeft: 8 } }, '\u25B8') : null,
        ]),
        // Submenu — positioned to the right of this item
        hasChildren && hovered === i ? createElement(MenuPanel, {
          key: 'sub',
          items: item.children!,
          x: '100%',
          y: 0,
          onClose,
        }) : null,
      ]);
    }),
  );
}

function ContextMenuOverlay({ ctx }: { ctx: TableContext }) {
  const [menu, setMenu] = useState<MenuState>({ open: false, x: 0, y: 0, items: [] });

  useEffect(() => {
    const unsub = ctx.on('contextmenu', (payload: unknown) => {
      const { x, y, items } = payload as { x: number; y: number; items: MenuItem[] };
      if (items.length > 0) setMenu({ open: true, x, y, items });
    });
    return unsub;
  }, [ctx]);

  useEffect(() => {
    if (!menu.open) return;
    const handler = () => setMenu((m) => ({ ...m, open: false }));
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menu.open]);

  useEffect(() => {
    if (!menu.open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu((m) => ({ ...m, open: false })); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [menu.open]);

  if (!menu.open) return null;

  // Wrapper with relative positioning for submenus
  return createElement('div', { style: { position: 'fixed', left: menu.x, top: menu.y, zIndex: 9999 } },
    createElement(MenuPanel, { items: menu.items, x: 0, y: 0, onClose: () => setMenu((m) => ({ ...m, open: false })) }),
  );
}

export function contextMenu(extraItems?: MenuItemFactory): TablePlugin {
  return {
    name: 'contextMenu',
    contextMenuItems(ctx: TableContext) {
      const items = defaultItems(ctx);
      if (extraItems) {
        items.push({ label: '', action: () => {}, type: 'separator' });
        items.push(...extraItems(ctx));
      }
      return items;
    },
    headerContextMenuItems(ctx: TableContext, column: ResolvedColumn) {
      return defaultHeaderItems(ctx, column);
    },
    renderOverlay(ctx: TableContext) {
      return createElement(ContextMenuOverlay, { ctx });
    },
  };
}
