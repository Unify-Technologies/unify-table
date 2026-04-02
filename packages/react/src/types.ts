import type { ReactNode } from 'react';
import type {
  QueryEngine,
  DataSource,
  FilterExpr,
  SortField,
  TableConnection,
  ColumnInfo,
  Row,
  ViewManager,
} from '@unify/table-core';

// --- Column definitions ---

export interface ColumnDef {
  field: string;
  label?: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  pin?: 'left' | 'right';
  hidden?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  editable?: boolean;
  format?: string;
  render?: (value: unknown, row: Row) => ReactNode;
  editor?:
    | 'text'
    | 'number'
    | 'date'
    | 'select'
    | 'textarea'
    | 'checkbox'
    | ((value: unknown, onChange: (v: unknown) => void) => ReactNode);
  editorOptions?: unknown[];
  editorFreeform?: boolean;
  autoComplete?: boolean;
  validate?: (value: unknown) => true | string;
  cellStyle?: string | ((value: unknown, row: Row) => string);
  headerStyle?: string;
}

// --- Styling ---

export interface TableStyles {
  root?: string;
  header?: string;
  headerCell?: string;
  row?: string;
  rowSelected?: string;
  rowEven?: string;
  cell?: string;
  cellEditing?: string;
  cellFocused?: string;
  footer?: string;
  empty?: string;
  loading?: string;
  filterBar?: string;
  groupRow?: string;
  resizeHandle?: string;
  contextMenu?: string;
  statusBar?: string;
}

// --- Plugin system ---

export interface CellRef {
  rowIndex: number;
  colIndex: number;
  rowId: string;
  field: string;
  value: unknown;
}

export interface MenuItem {
  label: string;
  action: () => void;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  type?: 'item' | 'separator';
  children?: MenuItem[];
}

export interface SelectionSpan {
  anchor: { row: number; col: number };
  focus: { row: number; col: number };
}

export interface SelectionState {
  /** Primary selection span */
  span: SelectionSpan | null;
  /** Additional spans (Ctrl+click) */
  additionalSpans: SelectionSpan[];
  /** Derived: set of selected row IDs */
  selectedIds: Set<string>;
  /** Derived: selected cells as flat array (for clipboard compat) */
  selectedCells: CellRef[];
  /** Derived: count of unique selected rows */
  count: number;
  asFilter: () => FilterExpr | null;
  /** Serialized group keys of selected group rows */
  selectedGroups: Set<string>;
  /** Count of selected groups */
  groupCount: number;
}

export function isInSpan(row: number, col: number, span: SelectionSpan): boolean {
  const r0 = Math.min(span.anchor.row, span.focus.row);
  const r1 = Math.max(span.anchor.row, span.focus.row);
  const c0 = Math.min(span.anchor.col, span.focus.col);
  const c1 = Math.max(span.anchor.col, span.focus.col);
  return row >= r0 && row <= r1 && col >= c0 && col <= c1;
}

export function isInAnySpan(row: number, col: number, state: SelectionState): boolean {
  if (state.span && isInSpan(row, col, state.span)) return true;
  return state.additionalSpans.some((s) => isInSpan(row, col, s));
}

export function isFullRowSpan(span: SelectionSpan, colCount: number): boolean {
  const c0 = Math.min(span.anchor.col, span.focus.col);
  const c1 = Math.max(span.anchor.col, span.focus.col);
  return c0 === 0 && c1 >= colCount - 1;
}

export interface EditBackend {
  commitEdit(cell: CellRef, value: unknown): Promise<void>;
  addRow(data: Row): Promise<void>;
  deleteRows(ids: string[]): Promise<void>;
  undo(): Promise<void>;
  redo(): Promise<void>;
  canUndo(): boolean;
  canRedo(): boolean;
}

export interface EditingState {
  editingCell: CellRef | null;
  startEditing(cell: CellRef): void;
  commitEdit(cell: CellRef, value: unknown): Promise<void>;
  cancelEdit(): void;
  addRow(data: Row): Promise<void>;
  deleteRows(ids: string[]): Promise<void>;
  undo(): Promise<void>;
  redo(): Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
}

export interface FormulasState {
  /** Get the current expression for a formula column. */
  getExpression(name: string): string | undefined;
  /** Update a formula column's expression. Re-syncs the view and refreshes all rows. */
  updateExpression(name: string, expression: string): Promise<void>;
  /** Undo the last formula expression change. */
  undo(): Promise<void>;
  /** Redo a previously undone formula expression change. */
  redo(): Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
}

export interface TableContext {
  // Data
  datasource: DataSource;
  engine: QueryEngine;
  table: string;
  /** The DuckDB VIEW name reflecting current filters + sort. */
  viewName: string;
  /** The ViewManager instance (for plugins that need to adjust the view chain). */
  viewManager: ViewManager;

  // State
  columns: ResolvedColumn[];
  rows: Row[];
  sort: SortField[];
  filters: FilterExpr[];
  groupBy: string[];
  totalCount: number;
  isLoading: boolean;
  selection: SelectionState;
  activeCell: CellRef | null;

  // Editing (provided by editing plugin — null when plugin is not registered)
  editing: EditingState | null;
  /** @internal Used by the editing plugin to publish its state. */
  _setEditing(state: EditingState | null): void;

  // Formulas (provided by formulas plugin — null when plugin is not registered)
  formulas: FormulasState | null;
  /** @internal Used by the formulas plugin to publish its state. */
  _setFormulas(state: FormulasState | null): void;

  // Mutations
  setSort(sort: SortField[]): void;
  setFilters(filters: FilterExpr[]): void;
  setGroupBy(groupBy: string[]): void;
  setSelection(selection: SelectionState): void;
  setActiveCell(cell: CellRef | null): void;

  // Events
  on(event: TableEvent, handler: TableEventHandler): () => void;
  emit(event: TableEvent, payload?: unknown): void;

  // Plugin access
  getPlugin<T extends TablePlugin>(name: string): T | undefined;

  /** Get the latest context state (avoids stale closures in plugin init). */
  getLatest(): TableContext;

  // Virtual scroll
  containerRef: React.RefObject<HTMLDivElement | null>;

  // Refresh
  refresh(): Promise<void>;

  // Infinite scroll — request rows in a range to be loaded
  requestRange(startRow: number, endRow: number): void;

  // Column resize
  setColumnWidth(field: string, width: number): void;

  // Column reorder
  setColumnOrder(order: string[]): void;

  // Column pin
  setColumnPin(field: string, pin: 'left' | 'right' | null): void;
}

export type TableEvent =
  | 'sort'
  | 'filter'
  | 'group'
  | 'select'
  | 'edit:start'
  | 'edit:commit'
  | 'edit:cancel'
  | 'edit:invalid'
  | 'row:add'
  | 'row:delete'
  | 'data'
  | 'loading'
  | 'error'
  | 'group:expand'
  | 'group:collapse'
  | 'column:reorder'
  | (string & {}); // extensible for plugins

export type TableEventHandler = (payload?: unknown) => void;

export interface TablePlugin {
  name: string;
  dependencies?: string[];
  init?(ctx: TableContext): void | (() => void);
  transformQuery?(sql: string): string;
  transformColumns?(columns: ResolvedColumn[]): ResolvedColumn[];
  transformRows?(rows: Row[]): Row[];
  shortcuts?: Record<string, (ctx: TableContext) => void>;
  contextMenuItems?: (ctx: TableContext, cell: CellRef) => MenuItem[];
  headerContextMenuItems?: (ctx: TableContext, column: ResolvedColumn) => MenuItem[];
  renderAbove?: (ctx: TableContext) => ReactNode;
  renderBelow?: (ctx: TableContext) => ReactNode;
  renderFooter?: (ctx: TableContext) => ReactNode;
  renderOverlay?: (ctx: TableContext) => ReactNode;
}

export interface ResolvedColumn extends ColumnDef {
  /** Current display width (after resize) */
  currentWidth: number;
  /** Column info from DuckDB schema */
  columnInfo?: ColumnInfo;
  /** Sticky left/right offset in px (set by columnPin plugin) */
  _pinOffset?: number;
  /** True on last-left-pinned or first-right-pinned column (for edge shadow) */
  _pinEdge?: boolean;
  /** True if this is a formula/computed column */
  _isFormula?: boolean;
  /** The SQL expression for a formula column (set by formulas plugin) */
  _formulaExpression?: string;
}

// --- Table Props ---

export interface TableProps {
  db: TableConnection;
  table: string;
  columns?: (ColumnDef | string)[];
  plugins?: TablePlugin[];
  styles?: TableStyles;
  className?: string;
  density?: 'compact' | 'comfortable' | 'spacious';
  rowId?: string | string[];
  rowStyle?: (row: Row, index: number) => string;
  onRowClick?: (row: Row) => void;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  height?: number | string;
  pageSize?: number;
  /** Custom footer renderer. Receives totalCount, isLoading, selection. Return null to hide footer. */
  renderFooter?: (info: { totalCount: number; isLoading: boolean; selection: SelectionState }) => React.ReactNode;
  /** Called when totalCount is known/updated — useful for displaying count outside the table. */
  onTotalCount?: (count: number) => void;
  /** Panel configuration. Array of built-in names or custom descriptors. Set to `false` to disable panels. Default: all built-in panels. */
  panels?: false | import('./panels/types.js').PanelConfig[];
  /** Panel position relative to the table. Default: 'right'. */
  panelPosition?: 'left' | 'right';
  /** Initial display configurations. */
  displays?: import('@unify/table-core').DisplayConfig[];
  /** Called when displays change (add, remove, config update). */
  onDisplaysChange?: (displays: import('@unify/table-core').DisplayConfig[]) => void;
  /** Called when the active display changes. `null` means the table view is active. */
  onActiveDisplayChange?: (displayType: string | null) => void;
  /** Initial active display ID (must match an id in `displays`). When set, that display is shown on mount. */
  initialActiveDisplay?: string | null;

  // ── Persisted table state (sort, filters, groupBy, etc.) ──
  /** Initial sort state. */
  initialSort?: import('@unify/table-core').SortField[];
  /** Called when sort changes. */
  onSortChange?: (sort: import('@unify/table-core').SortField[]) => void;
  /** Initial raw filter input values (field → text). */
  initialFilterValues?: Record<string, string>;
  /** Called when filter input values change. */
  onFilterValuesChange?: (values: Record<string, string>) => void;
  /** Initial groupBy columns. */
  initialGroupBy?: string[];
  /** Called when groupBy columns change. */
  onGroupByChange?: (cols: string[]) => void;
  /** Initial hidden columns. */
  initialHiddenCols?: string[];
  /** Called when hidden columns change. */
  onHiddenColsChange?: (cols: string[]) => void;
  /** Initial aggregation functions per field. */
  initialAggFns?: Record<string, string>;
  /** Called when aggregation functions change. */
  onAggFnsChange?: (fns: Record<string, string>) => void;

  // ── Column order & widths persistence ──
  /** Initial column order (array of field names). */
  initialColumnOrder?: string[];
  /** Called when column order changes (reorder). */
  onColumnOrderChange?: (order: string[]) => void;
  /** Initial column widths (field → width in px). */
  initialColumnWidths?: Record<string, number>;
  /** Called when any column width changes. */
  onColumnWidthsChange?: (widths: Record<string, number>) => void;
}
