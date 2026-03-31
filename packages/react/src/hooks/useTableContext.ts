import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createQueryEngine,
  createDataSource,
  createViewManager,
  toSqlLiteral,
  quoteIdent,
} from '@unify/table-core';
import type {
  TableConnection,
  SortField,
  FilterExpr,
  Row,
  ColumnInfo,
} from '@unify/table-core';
import type {
  TableContext,
  TablePlugin,
  TableEvent,
  TableEventHandler,
  CellRef,
  SelectionState,
  ResolvedColumn,
  ColumnDef,
} from '../types.js';
import { createPageCache } from '../page_cache.js';
import { emptySelection } from '../utils.js';

const DEFAULT_PAGE_SIZE = 200;
const DEFAULT_WIDTH = 150;
let viewIdCounter = 0;

interface UseTableContextOptions {
  db: TableConnection;
  table: string;
  columns?: (ColumnDef | string)[];
  plugins?: TablePlugin[];
  pageSize?: number;
  rowId?: string | string[];
}

function normalizeColumn(col: ColumnDef | string): ColumnDef {
  return typeof col === 'string' ? { field: col } : col;
}

function resolveColumn(def: ColumnDef, info?: ColumnInfo): ResolvedColumn {
  return {
    ...def,
    label: def.label ?? def.field,
    sortable: def.sortable ?? true,
    filterable: def.filterable ?? true,
    resizable: def.resizable ?? true,
    currentWidth: def.width ?? DEFAULT_WIDTH,
    columnInfo: info,
    align: def.align ?? (info?.mappedType === 'number' || info?.mappedType === 'bigint' ? 'right' : 'left'),
  };
}

// ─── Hook ────────────────────────────────────────────────────

export function useTableContext(options: UseTableContextOptions): TableContext {
  const { db, table, columns: columnsProp, plugins = [], pageSize = DEFAULT_PAGE_SIZE, rowId } = options;

  const engine = useMemo(() => createQueryEngine(db), [db]);

  // Create a ViewManager per table instance. The view reflects filters + sort.
  const viewManager = useMemo(() => createViewManager(engine, table, String(viewIdCounter++)), [engine, table]);
  const datasource = useMemo(() => createDataSource(engine, table, { viewManager }), [engine, table, viewManager]);

  // Cleanup view on unmount
  useEffect(() => {
    return () => { viewManager.drop().catch(() => {}); };
  }, [viewManager]);

  // Page cache
  const cacheRef = useRef(createPageCache());
  const inflightRef = useRef(new Set<number>());

  // State
  const [rows, setRows] = useState<Row[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvedColumns, setResolvedColumns] = useState<ResolvedColumn[]>([]);
  const [sort, setSort] = useState<SortField[]>([]);
  const [filters, setFilters] = useState<FilterExpr[]>([]);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [selection, setSelection] = useState<SelectionState>(emptySelection);
  const [activeCell, setActiveCell] = useState<CellRef | null>(null);
  const [editingCell, setEditingCell] = useState<CellRef | null>(null);
  const groupColWidthRef = useRef<number | null>(null);

  // Undo/redo
  interface EditAction { type: 'update' | 'insert' | 'delete'; sql: string; undoSql: string; }
  const undoStack = useRef<EditAction[]>([]);
  const redoStack = useRef<EditAction[]>([]);

  // Events
  const listenersRef = useRef(new Map<TableEvent, Set<TableEventHandler>>());
  const containerRef = useRef<HTMLDivElement>(null);

  const emit = useCallback((event: TableEvent, payload?: unknown) => {
    listenersRef.current.get(event)?.forEach((h) => h(payload));
  }, []);

  const on = useCallback((event: TableEvent, handler: TableEventHandler): (() => void) => {
    if (!listenersRef.current.has(event)) listenersRef.current.set(event, new Set());
    listenersRef.current.get(event)!.add(handler);
    return () => listenersRef.current.get(event)?.delete(handler);
  }, []);

  // ── Column discovery ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const schemaColumns = await engine.columns(table);
      if (cancelled) return;
      if (columnsProp && columnsProp.length > 0) {
        const defs = columnsProp.map(normalizeColumn);
        const infoMap = new Map(schemaColumns.map((c) => [c.name, c]));
        setResolvedColumns(defs.filter((d) => !d.hidden).map((d) => resolveColumn(d, infoMap.get(d.field))));
      } else {
        setResolvedColumns(schemaColumns.map((info) => resolveColumn({ field: info.name }, info)));
      }
    })();
    return () => { cancelled = true; };
  }, [engine, table, columnsProp]);

  // ── Fetch a specific page ────────────────────────────────
  const fetchPage = useCallback(
    async (pageIdx: number) => {
      if (cacheRef.current.get(pageIdx) || inflightRef.current.has(pageIdx)) return;
      inflightRef.current.add(pageIdx);

      try {
        const offset = pageIdx * pageSize;
        const page = await datasource.fetch({ offset, limit: pageSize });
        cacheRef.current.set(pageIdx, page.rows);
        setTotalCount(page.total);
        // Rebuild flat row array
        setRows(cacheRef.current.flatten(page.total, pageSize));
      } finally {
        inflightRef.current.delete(pageIdx);
      }
    },
    [datasource, pageSize]
  );

  // ── Request visible range — called by Table on scroll ────
  const requestRange = useCallback(
    (startRow: number, endRow: number) => {
      const startPage = Math.floor(startRow / pageSize);
      const endPage = Math.floor(endRow / pageSize);
      // Fetch current page + neighbors (page-1, page, page+1)
      const pagesToFetch = new Set<number>();
      for (let p = Math.max(0, startPage - 1); p <= endPage + 1; p++) {
        pagesToFetch.add(p);
      }
      for (const p of pagesToFetch) {
        fetchPage(p);
      }
    },
    [fetchPage, pageSize]
  );

  // ── Initial load ──────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    (async () => {
      try {
        // Fetch total count + first page
        const page = await datasource.fetch({ offset: 0, limit: pageSize });
        cacheRef.current.set(0, page.rows);
        setTotalCount(page.total);
        setRows(cacheRef.current.flatten(page.total, pageSize));
        emit('data', page);
        // Prefetch page 1
        if (page.total > pageSize) {
          fetchPage(1);
        }
      } catch (err) {
        emit('error', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [datasource, pageSize, emit, fetchPage]);

  // ── Re-fetch on sort/filter/group change ──────────────────
  const versionRef = useRef(datasource.version);
  useEffect(() => {
    const unsub = datasource.on('data', () => {
      if (datasource.version !== versionRef.current) {
        versionRef.current = datasource.version;
        // Invalidate cache, re-fetch from scratch
        cacheRef.current.clear();
        inflightRef.current.clear();
        setIsLoading(true);
        (async () => {
          try {
            const page = await datasource.fetch({ offset: 0, limit: pageSize });
            cacheRef.current.set(0, page.rows);
            setTotalCount(page.total);
            setRows(cacheRef.current.flatten(page.total, pageSize));
            emit('data', page);
          } catch (err) {
            emit('error', err);
          } finally {
            setIsLoading(false);
          }
        })();
      }
    });
    return unsub;
  }, [datasource, pageSize, emit]);

  // ── Sort/filter/group handlers ────────────────────────────
  const handleSetSort = useCallback((newSort: SortField[]) => {
    // Translate synthetic __group__ column to all groupBy fields (cumulative, in column order)
    const resolved = newSort.flatMap((s) =>
      s.field === '__group__' && groupBy.length > 0
        ? groupBy.map((field) => ({ field, dir: s.dir }))
        : [s],
    );
    setSort(resolved);
    datasource.setSort(resolved);
    emit('sort', resolved);
  }, [datasource, emit, groupBy]);

  const handleSetFilters = useCallback((newFilters: FilterExpr[]) => {
    setFilters(newFilters);
    datasource.setFilters(newFilters);
    emit('filter', newFilters);
  }, [datasource, emit]);

  const handleSetGroupBy = useCallback((newGroupBy: string[]) => {
    groupColWidthRef.current = null; // Reset merged column width for new grouping
    setGroupBy(newGroupBy);
    datasource.setGroupBy(newGroupBy);
    emit('group', newGroupBy);
  }, [datasource, emit]);

  // ── Column resize ──────────────────────────────────────────
  const setColumnWidth = useCallback((field: string, width: number) => {
    if (field === '__group__') {
      groupColWidthRef.current = Math.max(width, 50);
      // Force re-render by touching resolvedColumns identity
      setResolvedColumns((prev) => [...prev]);
      return;
    }
    setResolvedColumns((prev) =>
      prev.map((col) => col.field === field ? { ...col, currentWidth: Math.max(width, col.minWidth ?? 50) } : col)
    );
  }, []);

  // ── Column reorder ─────────────────────────────────────────
  const setColumnOrder = useCallback((order: string[]) => {
    setResolvedColumns((prev) => {
      const byField = new Map(prev.map((col) => [col.field, col]));
      const reordered: ResolvedColumn[] = [];
      for (const field of order) {
        const col = byField.get(field);
        if (col) reordered.push(col);
      }
      // Append any columns not in the order (e.g. newly added)
      for (const col of prev) {
        if (!order.includes(col.field)) reordered.push(col);
      }
      return reordered;
    });
    emit('column:reorder', order);
  }, [emit]);

  // ── Column pin ─────────────────────────────────────────────
  const setColumnPin = useCallback((field: string, pin: 'left' | 'right' | null) => {
    setResolvedColumns((prev) =>
      prev.map((col) => col.field === field ? { ...col, pin: pin ?? undefined } : col)
    );
    emit('column:pin', { field, pin });
  }, [emit]);

  // ── Row ID detection ──────────────────────────────────────
  const rowIdField = useMemo(() => {
    if (rowId) return Array.isArray(rowId) ? rowId[0] : rowId;
    const candidates = ['id', 'ID', '_id', 'rowid', '__table_rid'];
    for (const c of candidates) {
      if (resolvedColumns.some((col) => col.field === c)) return c;
    }
    return null;
  }, [rowId, resolvedColumns]);

  // ── Editing ───────────────────────────────────────────────
  const startEditing = useCallback((cell: CellRef) => {
    setEditingCell(cell);
    emit('edit:start', cell);
  }, [emit]);

  const fetchData = useCallback(async () => {
    cacheRef.current.clear();
    const page = await datasource.fetch({ offset: 0, limit: pageSize });
    cacheRef.current.set(0, page.rows);
    setTotalCount(page.total);
    setRows(cacheRef.current.flatten(page.total, pageSize));
  }, [datasource, pageSize]);

  const commitEdit = useCallback(async (cell: CellRef, value: unknown) => {
    if (!rowIdField) return;
    const oldValue = cell.value;
    const qt = quoteIdent(table);
    const qf = quoteIdent(cell.field);
    const qid = quoteIdent(rowIdField);
    const updateSql = `UPDATE ${qt} SET ${qf} = ${toSqlLiteral(value)} WHERE ${qid} = ${toSqlLiteral(cell.rowId)}`;
    const undoSqlStr = `UPDATE ${qt} SET ${qf} = ${toSqlLiteral(oldValue)} WHERE ${qid} = ${toSqlLiteral(cell.rowId)}`;
    await engine.execute(updateSql);
    undoStack.current.push({ type: 'update', sql: updateSql, undoSql: undoSqlStr });
    redoStack.current = [];
    setEditingCell(null);
    emit('edit:commit', { cell, value });
    await fetchData();
  }, [engine, table, rowIdField, emit, fetchData]);

  const cancelEdit = useCallback(() => { setEditingCell(null); emit('edit:cancel'); }, [emit]);

  const addRow = useCallback(async (data: Row) => {
    const cols = Object.keys(data);
    const vals = cols.map((c) => toSqlLiteral(data[c]));
    const sql = `INSERT INTO ${quoteIdent(table)} (${cols.map(quoteIdent).join(', ')}) VALUES (${vals.join(', ')})`;
    await engine.execute(sql);
    undoStack.current.push({ type: 'insert', sql, undoSql: '' });
    redoStack.current = [];
    emit('row:add', data);
    await fetchData();
  }, [engine, table, emit, fetchData]);

  const deleteRows = useCallback(async (ids: string[]) => {
    if (!rowIdField || ids.length === 0) return;
    const idList = ids.map(toSqlLiteral).join(', ');
    const sql = `DELETE FROM ${quoteIdent(table)} WHERE ${quoteIdent(rowIdField)} IN (${idList})`;
    await engine.execute(sql);
    undoStack.current.push({ type: 'delete', sql, undoSql: '' });
    redoStack.current = [];
    emit('row:delete', ids);
    await fetchData();
  }, [engine, table, rowIdField, emit, fetchData]);

  const undo = useCallback(async () => {
    const action = undoStack.current.pop();
    if (!action) return;
    await engine.execute(action.undoSql);
    redoStack.current.push(action);
    await fetchData();
  }, [engine, fetchData]);

  const redo = useCallback(async () => {
    const action = redoStack.current.pop();
    if (!action) return;
    await engine.execute(action.sql);
    undoStack.current.push(action);
    await fetchData();
  }, [engine, fetchData]);

  // ── Plugin transform pipeline ────────────────────────────
  const transformedColumns = useMemo(() => {
    let cols = resolvedColumns;
    for (const plugin of plugins) {
      if (plugin.transformColumns) cols = plugin.transformColumns(cols);
    }

    // When grouping is active, merge grouped columns into a single first column
    if (groupBy.length > 0) {
      const groupedSet = new Set(groupBy);
      const nonGroupedCols = cols.filter((c) => !groupedSet.has(c.field));

      const mergedLabel = groupBy
        .map((f) => {
          const col = cols.find((c) => c.field === f);
          return (col?.label ?? f).toUpperCase();
        })
        .join(' \u2022 ');

      const defaultWidth = groupBy.reduce((sum, f) => {
        const col = cols.find((c) => c.field === f);
        return sum + (col?.currentWidth ?? DEFAULT_WIDTH);
      }, 0);

      const mergedCol: ResolvedColumn = {
        field: '__group__',
        label: mergedLabel,
        sortable: true,
        filterable: false,
        resizable: true,
        currentWidth: groupColWidthRef.current ?? Math.max(200, defaultWidth),
        align: 'left',
      };

      cols = [mergedCol, ...nonGroupedCols];
    }

    return cols;
  }, [resolvedColumns, plugins, groupBy]);

  const transformedRows = useMemo(() => {
    let r = rows;
    for (const plugin of plugins) {
      if (plugin.transformRows) r = plugin.transformRows(r);
    }
    return r;
  }, [rows, plugins]);

  // ── Plugin management ─────────────────────────────────────
  const pluginMap = useRef(new Map<string, TablePlugin>());
  const ctxRef = useRef<TableContext>(null!);

  const ctx: TableContext = useMemo(
    () => ({
      datasource, engine, table, viewName: viewManager.viewName,
      columns: transformedColumns, rows: transformedRows, sort, filters, groupBy,
      totalCount, isLoading, selection, activeCell, editingCell,
      setSort: handleSetSort, setFilters: handleSetFilters, setGroupBy: handleSetGroupBy,
      setSelection, setActiveCell, startEditing, commitEdit, cancelEdit,
      addRow, deleteRows, undo, redo,
      canUndo: undoStack.current.length > 0,
      canRedo: redoStack.current.length > 0,
      on, emit,
      getPlugin: <T extends TablePlugin>(name: string) => pluginMap.current.get(name) as T | undefined,
      getLatest: () => ctxRef.current!,
      containerRef,
      refresh: fetchData,
      requestRange,
      setColumnWidth,
      setColumnOrder,
      setColumnPin,
    }),
    [
      datasource, engine, table, viewManager, transformedColumns, transformedRows, sort, filters, groupBy,
      totalCount, isLoading, selection, activeCell, editingCell,
      handleSetSort, handleSetFilters, handleSetGroupBy,
      startEditing, commitEdit, cancelEdit, addRow, deleteRows,
      undo, redo, on, emit, fetchData, requestRange, setColumnWidth, setColumnOrder, setColumnPin,
    ]
  );

  // Keep ref updated so plugins always see latest state via getLatest()
  ctxRef.current = ctx;

  // Initialize plugins only when the plugins array changes (not on every ctx change)
  useEffect(() => {
    const cleanups: (() => void)[] = [];
    for (const plugin of plugins) {
      pluginMap.current.set(plugin.name, plugin);
      if (plugin.init) {
        const cleanup = plugin.init(ctx);
        if (cleanup) cleanups.push(cleanup);
      }
    }
    return () => cleanups.forEach((c) => c());
  }, [plugins]); // eslint-disable-line react-hooks/exhaustive-deps

  return ctx;
}
