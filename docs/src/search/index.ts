export interface SearchItem {
  title: string;
  path: string;
  keywords: string[];
  description?: string;
  section?: string;
}

export const SEARCH_INDEX: SearchItem[] = [
  { title: "Home", path: "/", keywords: ["introduction", "overview", "landing"], section: "Overview" },
  { title: "Getting Started", path: "/getting-started", keywords: ["install", "setup", "quickstart", "npm", "pnpm", "react", "duckdb"], description: "5-minute quick start guide", section: "Overview" },
  { title: "How It Works", path: "/how-it-works", keywords: ["architecture", "layers", "duckdb", "sql", "react", "core"], description: "Architecture and design philosophy", section: "Overview" },
  { title: "Table Basics", path: "/table-basics", keywords: ["table", "component", "props", "basic", "minimal", "db", "plugins", "filters", "columns"], description: "Table component and adding plugins", section: "Core Concepts" },
  { title: "Column Definitions", path: "/column-definitions", keywords: ["column", "field", "render", "format", "editor", "type", "string", "number", "date", "boolean", "auto-detect"], description: "Control how columns are displayed and edited", section: "Core Concepts" },
  { title: "Density & Layout", path: "/density-layout", keywords: ["density", "compact", "comfortable", "spacious", "height", "virtual", "scroll", "row", "padding"], description: "Row height, table sizing, virtual scrolling", section: "Core Concepts" },
  { title: "Themes", path: "/themes", keywords: ["theme", "dark", "light", "css", "style", "custom", "darkTheme", "lightTheme", "panelVars", "containerClass"], description: "Built-in dark/light themes and CSS customization", section: "Core Concepts" },
  { title: "Plugins Overview", path: "/plugins", keywords: ["plugin", "architecture", "custom", "lifecycle", "TablePlugin", "composable"], description: "Plugin composition model and lifecycle", section: "Features" },
  { title: "Filters", path: "/plugins/filters", keywords: ["filter", "search", "query", "column", "input", "ILIKE", "WHERE", "predicate"], description: "Column-level filter inputs with SQL-backed filtering", section: "Features" },
  { title: "Selection", path: "/plugins/selection", keywords: ["select", "range", "multi", "single", "cell", "click", "shift", "ctrl", "keyboard", "rectangle"], description: "Single, multi, and range cell selection", section: "Features" },
  { title: "Editing", path: "/plugins/editing", keywords: ["edit", "inline", "cell", "validation", "undo", "double-click", "enter", "escape", "blur"], description: "Inline cell editing with validation", section: "Features" },
  { title: "Keyboard", path: "/plugins/keyboard", keywords: ["keyboard", "navigation", "arrow", "tab", "enter", "shortcut", "ctrl", "delete", "escape"], description: "Arrow keys, Tab, Enter, and shortcut support", section: "Features" },
  { title: "Clipboard", path: "/plugins/clipboard", keywords: ["copy", "paste", "clipboard", "tsv", "ctrl-c", "ctrl-v", "append"], description: "Copy/paste with TSV format support", section: "Features" },
  { title: "Column Resize", path: "/plugins/column-resize", keywords: ["resize", "width", "drag", "column", "handle", "double-click", "auto-fit"], description: "Drag handles for column width", section: "Features" },
  { title: "Column Pin", path: "/plugins/column-pin", keywords: ["pin", "freeze", "sticky", "left", "right", "fixed"], description: "Pin columns to left or right edge", section: "Features" },
  { title: "Column Reorder", path: "/plugins/column-reorder", keywords: ["reorder", "drag", "drop", "column", "move", "rearrange"], description: "Drag-and-drop column reordering", section: "Features" },
  { title: "Context Menu", path: "/plugins/context-menu", keywords: ["context", "menu", "right-click", "action", "export", "copy", "sort", "submenu"], description: "Right-click menus with nested submenus", section: "Features" },
  { title: "Views", path: "/plugins/views", keywords: ["view", "save", "load", "preset", "state", "snapshot", "restore"], description: "Save and restore table view presets", section: "Features" },
  { title: "Table I/O", path: "/plugins/table-io", keywords: ["import", "export", "csv", "json", "parquet", "file", "download", "upload"], description: "Import/export CSV, JSON, and Parquet files", section: "Features" },
  { title: "Find & Replace", path: "/plugins/find-replace", keywords: ["find", "replace", "search", "regex", "match", "text"], description: "Find and replace across the table", section: "Features" },
  { title: "Formulas", path: "/plugins/formulas", keywords: ["formula", "computed", "column", "expression", "calculate"], description: "Formula columns with expression evaluation", section: "Features" },
  { title: "Row Grouping", path: "/plugins/row-grouping", keywords: ["group", "aggregate", "collapse", "expand", "hierarchy", "sum", "count", "avg", "tree"], description: "Group by columns with aggregations", section: "Features" },
  { title: "Formatting", path: "/plugins/formatting", keywords: ["format", "conditional", "color", "style", "negative", "positive", "threshold", "cell", "rule"], description: "Conditional cell formatting rules", section: "Features" },
  { title: "Status Bar", path: "/plugins/status-bar", keywords: ["status", "footer", "sum", "average", "count", "aggregation", "bar", "bottom"], description: "Footer bar with selection aggregations", section: "Features" },
  { title: "Presets", path: "/presets", keywords: ["preset", "spreadsheet", "dataViewer", "readOnly", "bundle", "curated", "plugin"], description: "Curated plugin bundles for common use cases", section: "Features" },
  { title: "Panels", path: "/panels", keywords: ["panel", "sidebar", "filter", "groupby", "columns", "export", "side"], description: "Side panels for filtering, grouping, and more", section: "Features" },
  { title: "Displays Overview", path: "/displays", keywords: ["display", "visualization", "chart", "stats", "pivot", "summary", "alternative", "view"], description: "Alternative visualizations for table data", section: "Displays & Charts" },
  { title: "Chart Display", path: "/displays/chart", keywords: ["chart", "bar", "line", "pie", "donut", "scatter", "histogram", "heatmap", "treemap", "funnel", "area"], description: "10 chart types: bar, line, area, pie, donut, scatter, histogram, heatmap, treemap, funnel", section: "Displays & Charts" },
  { title: "Stats Display", path: "/displays/stats", keywords: ["stats", "summary", "aggregation", "card", "count", "sum", "avg", "min", "max"], description: "Summary statistic cards with compact notation", section: "Displays & Charts" },
  { title: "Pivot Display", path: "/displays/pivot", keywords: ["pivot", "cross-tab", "matrix", "row", "column", "totals", "crosstab"], description: "Cross-tabulation matrix with row/column totals", section: "Displays & Charts" },
  { title: "Summary Display", path: "/displays/summary", keywords: ["summary", "profile", "auto", "distribution", "histogram", "SUMMARIZE"], description: "Auto-profile every column with distribution histograms", section: "Displays & Charts" },
  { title: "Correlation Display", path: "/displays/correlation", keywords: ["correlation", "pearson", "heatmap", "numeric", "matrix"], description: "Pairwise Pearson correlation heatmap", section: "Displays & Charts" },
  { title: "Timeline Display", path: "/displays/timeline", keywords: ["timeline", "time", "date", "bucket", "trend", "series", "month", "week"], description: "Time-bucketed trend charts", section: "Displays & Charts" },
  { title: "Outliers Display", path: "/displays/outliers", keywords: ["outlier", "iqr", "zscore", "detection", "box", "plot", "anomaly"], description: "IQR/z-score outlier detection with box plots", section: "Displays & Charts" },
  { title: "SQL Builder", path: "/sql-builder", keywords: ["sql", "select", "update", "insert", "delete", "builder", "query", "where", "order", "limit", "join", "chainable", "immutable"], description: "Immutable, chainable SQL builder with four statement types", section: "Data Layer" },
  { title: "Filter System", path: "/filter-system", keywords: ["filter", "predicate", "eq", "neq", "gt", "gte", "lt", "lte", "contains", "startsWith", "endsWith", "and", "or", "not", "between", "oneOf", "isNull"], description: "Composable SQL filter predicates with type-safe builders", section: "Data Layer" },
  { title: "Query Engine", path: "/query-engine", keywords: ["engine", "datasource", "query", "reactive", "batch", "TableConnection", "DuckDB", "WASM", "connection"], description: "DuckDB connection interface and reactive data source", section: "Data Layer" },
  { title: "Charts", path: "/charts", keywords: ["echarts", "sparkline", "chart", "option", "builder", "EChartsWrapper", "barLineSql", "pieSql", "scatterSql"], description: "ECharts wrapper and SQL chart builders", section: "Displays & Charts" },
  { title: "Headless", path: "/headless", keywords: ["headless", "useTableContext", "hook", "custom", "render", "api", "programmatic"], description: "useTableContext hook for custom rendering", section: "Data Layer" },
  { title: "Demo", path: "/demo", keywords: ["demo", "playground", "full", "dockview", "interactive", "1M", "million", "rows", "trades"], description: "Full interactive demo with 1M rows", section: "Overview" },
];

export function fuzzyMatch(query: string, item: SearchItem): boolean {
  const q = query.toLowerCase();
  const text = `${item.title} ${item.keywords.join(" ")} ${item.description ?? ""}`.toLowerCase();
  if (text.includes(q)) return true;
  const words = q.split(/\s+/);
  return words.every((w) => text.includes(w));
}
