# unify-table

DuckDB-native data table & charts library. Replaces AG Grid/AG Charts with composable API backed by DuckDB-WASM.

## Philosophy

- **DuckDB does the work** — sort, filter, group, aggregate all happen in SQL. JS only renders visible viewport.
- **Plugin composition** — features are plugins, not props on a mega-component. Mix and match.
- **Zero-config default** — `<Table db={db} table="trades" />` just works. Complexity emerges from composition.

## Structure

```
packages/
  core/       @unify/table-core     — SQL builder, query engine, data source (zero deps)
    src/
      sql/          — SQL builders (select, filters, agg, chart, utils)
      displays/     — display type definitions (chart, stats, pivot, etc.)
  react/      @unify/table-react    — React table + 16 plugins + UI panels
    src/
      components/   — Table, TableRow, HeaderRow, GroupRow, ColumnResizeOverlay, Tooltip
      hooks/        — useTableContext
      plugins/      — 16 feature plugins
      panels/       — side panel components (filter, groupBy, columns, display, export, debug, etc.)
      displays/     — display renderers + config UI
      styles/       — themes.css
  charts/     @unify/table-charts   — ECharts wrapper + SQL chart builders
docs/             Vite + React + Tailwind + DuckDB-WASM docs site + interactive examples + Playwright E2E
  src/
    components/   — Callout, CodeBlock, Example, ExampleRunner, Heading, PageNav, PageTitle, PropTable, SearchDialog
    pages/        — documentation pages (top-level + plugin/ + display/ + demo/)
    examples/     — 33 interactive example files
    layout/       — Shell, Sidebar, TopNav, TableOfContents, MobileDrawer, nav
    providers/    — DuckDBProvider, ThemeProvider, useDuckDB, useExampleData
    data/         — sample datasets (employees, orders, products, tasks, trades)
    search/       — search index
    styles/       — global CSS
```

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| pnpm | 10.x | Package manager + workspaces |
| tsgo | @typescript/native-preview | TypeScript compilation |
| vite | 8.x | Docs app dev/build |
| oxlint | 1.x | Linting |
| oxfmt | 0.x | Formatting |
| vitest | 4.x | Unit + integration tests |
| playwright | latest | E2E tests |
| TanStack Virtual | 3.x | Row virtualization |
| ECharts | 5.x | Charts |
| Tailwind CSS | 4.x | Styling |
| lucide-react | 1.x | Icons |
| React | 19.x | UI framework |
| @base-ui/react | 1.x | Headless UI components |
| highlight.js | 11.x | Code syntax highlighting |
| dockview | 1.x | Tab/docking system for demo workspace |

Node >= 21.0.0 required.

## Commands

```sh
pnpm install              # install all deps
pnpm build                # build all packages (tsgo)
pnpm test                 # run all tests (vitest)
pnpm test:coverage        # run tests with coverage
pnpm lint                 # lint all packages (oxlint)
pnpm lint:fix             # lint + auto-fix
pnpm format               # format all packages (oxfmt)
pnpm test:e2e             # run E2E tests (playwright, docs app)
pnpm type:check           # type check without emitting
```

## Architecture

### Core Layer (`packages/core`)

Zero dependencies. Pure TypeScript.

**TableConnection** — minimal interface compatible with `IDuckDBConnection` from `@unify/unify-duckdb-common`:
```typescript
interface TableConnection {
  run(query: string): Promise<void>;
  runAndRead(query: string): Promise<Record<string, unknown>[]>;
  runAndReadParquetBlob(query: string): Promise<Blob>;
}
```

**QueryEngine** — thin wrapper. Methods: `query()`, `execute()`, `columns()`, `count()`, `distinct()`, `exportBlob()`.

**DataSource** — reactive state manager. Owns sort/filters/groupBy state. Emits events on change. Uses microtask batching via `queueMicrotask`.

**SQL Builder** — immutable, chainable. Four builders: `select()`, `update()`, `insertInto()`, `deleteFrom()`. Each returns new instance on mutation.

**Filters** — composable SQL predicates: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `contains`, `startsWith`, `endsWith`, `oneOf`, `between`, `isNull`, `isNotNull`. Combinators: `and()`, `or()`. Escape hatch: `raw()`.

**Aggregations** — built-in: sum, avg, count, min, max, count_distinct, median, first, last, any, mode, stddev, variance, string_agg. Extensible via `registerAgg()`.

### React Layer (`packages/react`)

**Table** — main component. Renders virtualized table via TanStack Virtual. Accepts `db`, `table`, `columns`, `plugins`.

**useTableContext** — headless hook. Returns full `TableContext` for custom rendering.

**Plugins** (17 total):
- `filters` — filter state management
- `selection` — single/multi/range cell selection
- `editing` — inline cell editing with validation
- `keyboard` — arrow keys, Tab, Enter, Escape, Delete, Ctrl shortcuts
- `clipboard` — copy/paste, TSV format, paste-as-append
- `columnResize` — drag handle for column width
- `columnPin` — pin columns left/right
- `columnReorder` — HTML5 drag-and-drop column reordering
- `contextMenu` — right-click menus with nested submenus
- `views` — save/load/apply view presets (filters + sort + groupBy)
- `tableIO` — import/export CSV, JSON, Parquet with progress events
- `findReplace` — find/replace across table with affected count
- `formulas` — formula columns with expression evaluation
- `rowGrouping` — group by columns, expand/collapse, aggregations
- `formatting` — conditional cell formatting (threshold, negative, positive rules)
- `statusBar` — aggregation status bar for selected cells (sum, avg, min, max)
- `fillHandle` — drag fill handle to extend cell values with pattern detection

**Panels:**
- `FilterPanel` — filter configuration UI
- `GroupByPanel` — group-by column selection
- `ColumnsPanel` — column visibility/ordering
- `DisplayPanel` — display type switcher + config
- `ExportPanel` — export options
- `DebugPanel` — troubleshooting/inspection
- `PanelShell` — shared panel container + layout
- `DragList` — reorderable list component used by panels

**Presets:**
- `spreadsheet()` — full editing experience (includes statusBar + fillHandle)
- `dataViewer()` — analytics-oriented read view (includes statusBar + rowGrouping + views)
- `readOnly()` — minimal: filters + columnResize + formatting

**Themes:** Built-in dark/light themes (`darkTheme`, `lightTheme`). Each `Theme` provides `styles` (TableStyles class names), `panelVars` (CSS variable overrides for panels), and `containerClass`. Pure CSS — no Tailwind dependency. Import CSS via sub-paths:
```typescript
import '@unify/table-react/styles';    // panel CSS
import '@unify/table-react/themes';    // theme class definitions
import '@unify/table-react/displays';  // display renderer CSS (charts, stats)
import { darkTheme, lightTheme } from '@unify/table-react';
```

### Charts Layer (`packages/charts`)

Direct dependency of `@unify/table-react` (not optional). Statically imported — no lazy loading.

SQL builders: `barLineSql` (bar/line/area), `pieSql` (pie/donut, supports series for nested rings), `scatterSql`, `histogramSql`, `heatmapSql`. Chart types also include treemap and funnel (config-only, no dedicated SQL builder).

Components: `<Sparkline>` (inline mini-chart), `<EChartsWrapper>` (low-level).

Option builders: `buildOption()`, `buildBarLineOption()`, `buildPieOption()`, `buildScatterOption()`, `buildHistogramOption()`, `buildHeatmapOption()`, `buildTreemapOption()`, `buildFunnelOption()`.

**Displays** (7 total) — two-layer architecture: core `DisplayType` (SQL-only, `packages/core/src/displays/`) + React `DisplayDescriptor` (rendering + config UI, `packages/react/src/displays/`). Each display type has `key`, `label`, `description`, `buildSql()`, `defaultConfig()`, `validate()`. Each descriptor has `icon` (lucide-react), `render()`, `renderConfig()`. Registered in `displays/defaults.ts`.

- `chart` — bar, line, area, pie, donut, scatter (LIMIT 5000 default), histogram, heatmap, treemap, funnel (reuses `@unify/table-charts`)
- `stats` — summary cards with aggregations per column, compact notation (K/M/B/T)
- `pivot` — cross-tabulation matrix (GROUP BY + client-side pivot), row/column totals, styled with `utbl-pivot-*` CSS classes
- `summary` — auto-profile every column via DuckDB `SUMMARIZE`, lazy histograms per card
- `correlation` — pairwise Pearson `CORR()` ECharts heatmap for numeric columns, index-based aliases (`p_i_j`)
- `timeline` — `date_trunc` bucketed time chart, reuses `buildBarLineOption` from charts package
- `outliers` — IQR/z-score detection via CTE, inline SVG box plot + outlier table, sentinel UNION ALL row (wrapped in subquery) for stats

All display `defaultConfig()` functions exclude identity columns (`id`, `*_id`) via `isIdentityColumn()`. The `DisplayRenderer` delegates data fetching to individual display components — each display calls `useDisplayData()` internally.

## Coding Conventions

- TypeScript strict mode, ES2021 target, ESM only
- No classes for data structures — plain objects + functions
- Composable functions over OOP builders
- File names: camelCase for single-word (`filters.ts`, `editing.ts`), snake_case for multi-word (`row_grouping.ts`, `column_reorder.ts`). camelCase functions, SCREAMING_SNAKE constants
- Keep APIs minimal — don't copy AG Grid patterns
- Folder structure follows separation of concerns: `components/` for React components, `hooks/` for custom hooks, `plugins/` for feature plugins, `styles/` for CSS, `config/` for constants/configuration, `context/` for React contexts, `data/` for static data

## SQL Safety Rules

**Non-negotiable.** Every SQL value must go through proper escaping:

- `toSqlLiteral(value)` — handles NULL, numbers, booleans, strings, dates
- `escapeString(value)` — wraps in single quotes, doubles internal quotes
- `quoteIdent(name)` — wraps identifiers in double quotes, escapes internal double quotes
- `isIdentityColumn(name)` — returns true for `id` or `*_id` columns; used to exclude identity columns from display defaults
- ILIKE patterns escape wildcards (`%`, `_`) via `ESCAPE '\'`
- **Never concatenate raw user input into SQL strings**

## Testing Rules

Every change validated at two levels:

1. **Unit tests (vitest)** — add or update tests for changed logic. Tests co-located in `tests/` dir per package. Run `pnpm test`.
2. **Playwright E2E** — validate in docs app. E2E tests in `docs/e2e/`. Confirm feature works in real browser.

Test patterns:
- Mock `TableConnection` for engine/datasource tests — no real DuckDB needed
- Use `@testing-library/react` for component tests with jsdom
- Assert SQL output strings for builder tests
- Test edge cases: NULL values, empty arrays, special characters in strings

## Roadmap

- **Unit test coverage** — add tests for remaining plugins (findReplace, selection, keyboard, contextMenu, editing, columnPin, tableIO, formulas)
- **Performance & scale** — profile with large datasets, optimize virtualization edge cases, identify bottlenecks
- **Mobile / responsive** — touch-friendly UI, responsive panels, small-screen experience
- **Chart color picker** — allow users to change series colors within the official palette from the chart display config UI
