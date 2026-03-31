# Unify Table

DuckDB-native data tables & charts for React.

SQL does the work. React renders the viewport.

Sort, filter, group, and aggregate millions of rows — all in DuckDB-WASM. 16 composable plugins. 7 display types. Zero-config to fully headless.

## Quick Start

```tsx
import { Table, spreadsheet } from '@unify/table-react';
import '@unify/table-react/styles';
import '@unify/table-react/themes';

<Table
  db={db}
  table="trades"
  plugins={spreadsheet()}
  height={600}
/>
```

## Features

**DuckDB-Powered** — Sort, filter, group, aggregate — all in SQL. Handles millions of rows natively in the browser.

**Plugin Composition** — 16 plugins, mix and match. Not a mega-component with 200 props. Start minimal, add what you need.

**7 Display Types** — Charts, stats, pivot, summary, correlation, timeline, and outlier detection. All driven by SQL.

**Type-Safe SQL** — Immutable, chainable query builder with composable filter predicates. No raw string concatenation.

## Packages

| Package | Description |
|---------|-------------|
| `@unify/table-core` | SQL builder, query engine, data source (zero deps) |
| `@unify/table-react` | React table + 16 plugins + panels + displays |
| `@unify/table-charts` | ECharts wrapper + SQL chart builders |

## Plugins

| Plugin | Description |
|--------|-------------|
| `filters()` | Column-level filter inputs with composable SQL predicates |
| `selection()` | Single, multi, or range cell selection |
| `editing()` | Inline cell editing with validation and DuckDB write-back |
| `keyboard()` | Arrow keys, Tab, Enter, Escape, Ctrl shortcuts |
| `clipboard()` | Copy/paste in TSV format, paste-as-append |
| `columnResize()` | Drag column borders to resize |
| `columnPin()` | Pin columns left/right |
| `columnReorder()` | Drag-and-drop column reordering |
| `contextMenu()` | Right-click menus with nested submenus |
| `views()` | Save/load view presets (filters + sort + groupBy) |
| `tableIO()` | Import/export CSV, JSON, Parquet |
| `findReplace()` | Find and replace across the table |
| `formulas()` | Formula columns with expression evaluation |
| `rowGrouping()` | Group by columns with aggregations |
| `formatting()` | Conditional cell formatting rules |
| `statusBar()` | Aggregation bar for selected cells |

**Presets** bundle plugins for common use cases:

```tsx
plugins={spreadsheet()}  // Full editing experience
plugins={dataViewer()}   // Analytics-oriented read view
plugins={readOnly()}     // Minimal: filters + resize + formatting
```

## Display Types

| Display | Description |
|---------|-------------|
| Chart | Bar, line, area, pie, scatter, histogram, heatmap, treemap, funnel |
| Stats | Summary cards with aggregations per column |
| Pivot | Cross-tabulation matrix with row/column totals |
| Summary | Auto-profile every column via DuckDB SUMMARIZE |
| Correlation | Pairwise Pearson correlation heatmap |
| Timeline | Date-bucketed time series chart |
| Outliers | IQR/z-score detection with box plots |

## Architecture

```
React Layer (@unify/table-react)          UI + plugins + displays
        |
Charts Layer (@unify/table-charts)        ECharts + SQL chart builders
        |
Core Layer (@unify/table-core)            SQL builder + query engine + data source
        |
DuckDB-WASM                               All data processing
```

Every interaction follows the same pipeline: **user action > state change > SQL generation > DuckDB execution > viewport render**. The JavaScript layer never touches your data directly — it describes what it wants via SQL.

## Development

```sh
pnpm install        # install all deps
pnpm build          # build all packages
pnpm test           # run tests
pnpm lint           # lint
pnpm format         # format
```

Node >= 21 required.

## Documentation

[Documentation site](https://unify.sh/unify-table) | [LLM-ready docs](https://unify.sh/unify-table/llms.txt)

## License

MIT
