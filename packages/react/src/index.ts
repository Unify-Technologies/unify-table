// @unify/table-react — React table component with DuckDB backend

// Main component
export { Table, TableView } from './components/Table.js';
export { Tooltip } from './components/Tooltip.js';

// Core hook
export { useTableContext } from './hooks/useTableContext.js';

// Plugins
export {
  filters,
  selection,
  editing,
  keyboard,
  clipboard,
  parseTSV,
  detectHeaderRow,
  columnResize,
  columnPin,
  contextMenu,
  views,
  saveView,
  applyView,
  listViews,
  serializeViews,
  tableIO,
  findReplace,
  findInTable,
  replaceInTable,
  formulas,
  addFormulaColumn,
  removeFormulaColumn,
  formulaViewSql,
  rowGrouping,
  isGroupRow,
  serializeGroupKey,
  toggleGroup,
  columnReorder,
  formatting,
  threshold,
  negative,
  positive,
  statusBar,
} from './plugins/index.js';
export type { TableIOHandle, GroupRow, ConditionalRule, StatusBarOptions } from './plugins/index.js';

// Presets
export { spreadsheet, dataViewer, readOnly } from './presets.js';

// Themes
export { darkTheme, lightTheme } from './themes.js';
export type { Theme } from './themes.js';

// Panels
export { PanelShell, FilterPanel, GroupByPanel, ColumnsPanel, ExportPanel, DebugPanel } from './panels/index.js';
export type { BuiltInPanel, PanelDescriptor, PanelConfig, AggFn } from './panels/index.js';

// Displays
export {
  DisplayBar,
  DisplayRenderer,
  registerDisplay,
  getDisplay,
  listDisplays,
  clearDisplays,
  useDisplayData,
  chartDisplay,
  statsDisplay,
  registerDefaultDisplays,
} from './displays/index.js';
export type {
  DisplayDescriptor,
  DisplayRenderProps,
  DisplayConfigProps,
  DisplayBarProps,
  DisplayRendererProps,
  UseDisplayDataResult,
} from './displays/index.js';

// Types
export type {
  TableProps,
  TableStyles,
  TableContext,
  TablePlugin,
  TableEvent,
  ColumnDef,
  ResolvedColumn,
  CellRef,
  MenuItem,
  SelectionState,
  SelectionSpan,
  EditBackend,
} from './types.js';
export type { EditingOptions } from './plugins/editing.js';

// Utility functions
export { isInSpan, isInAnySpan, isFullRowSpan } from './types.js';
export { emptySelection } from './utils.js';
