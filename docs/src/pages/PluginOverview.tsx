import { PageTitle } from "../components/PageTitle";
import { Heading } from "../components/Heading";
import { CodeBlock } from "../components/CodeBlock";
import { Callout } from "../components/Callout";
import { Link } from "../router";
import { useTheme } from "../providers/ThemeProvider";
import { PageNav } from "../components/PageNav";

const PLUGINS = [
  { name: "filters", path: "/plugins/filters", desc: "Column filter inputs with debounced queries" },
  { name: "selection", path: "/plugins/selection", desc: "Single, multi, or range cell selection" },
  { name: "editing", path: "/plugins/editing", desc: "Inline cell editing with validation" },
  { name: "keyboard", path: "/plugins/keyboard", desc: "Arrow keys, Tab, Enter, Escape navigation" },
  { name: "clipboard", path: "/plugins/clipboard", desc: "Copy/paste with TSV format support" },
  { name: "columnResize", path: "/plugins/column-resize", desc: "Drag column borders to resize" },
  { name: "columnPin", path: "/plugins/column-pin", desc: "Pin columns left or right" },
  { name: "columnReorder", path: "/plugins/column-reorder", desc: "Drag-and-drop column reordering" },
  { name: "contextMenu", path: "/plugins/context-menu", desc: "Right-click menus with nested items" },
  { name: "views", path: "/plugins/views", desc: "Save and restore view presets" },
  { name: "tableIO", path: "/plugins/table-io", desc: "Import/export CSV, JSON, Parquet" },
  { name: "findReplace", path: "/plugins/find-replace", desc: "Search and replace across table" },
  { name: "formulas", path: "/plugins/formulas", desc: "Computed columns via SQL expressions" },
  { name: "rowGrouping", path: "/plugins/row-grouping", desc: "Group rows with aggregations" },
  { name: "formatting", path: "/plugins/formatting", desc: "Conditional cell formatting rules" },
  { name: "statusBar", path: "/plugins/status-bar", desc: "Footer with selection aggregations" },
];

export default function PluginOverview() {
  const { dark } = useTheme();
  const border = dark ? "var(--doc-border)" : "var(--color-border)";
  const accent = dark ? "var(--doc-accent)" : "var(--color-accent)";
  const textSec = dark ? "var(--doc-text-secondary)" : "var(--color-text-secondary)";

  return (
    <div>
      <PageTitle>Plugins</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: textSec }}>
        Features are composable plugins, not props on a mega-component.
      </p>

      <Heading level={2} id="why-plugins">Why Plugins?</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Traditional data tables suffer from prop explosion — hundreds of props on a single component,
        each toggling a different behavior. The result is a monolithic API that's hard to learn, hard
        to test, and impossible to tree-shake. Every user pays the bundle cost for every feature,
        whether they use it or not.
      </p>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Plugins flip this model. Each feature — filtering, selection, editing, clipboard — lives in its
        own isolated module with its own state, its own tests, and its own bundle weight. You compose
        the exact set of capabilities you need as an array, and the table assembles them at runtime.
        If you never import <code>editing()</code>, it never ships to your users.
      </p>
      <Callout type="tip" title="Tree-shaking by design">
        Because plugins are standalone functions, bundlers can eliminate unused plugins entirely.
        A read-only table with just <code>filters()</code> and <code>columnResize()</code> ships
        a fraction of the code compared to a full spreadsheet setup.
      </Callout>

      <Heading level={2} id="architecture">Plugin Architecture</Heading>
      <CodeBlock code={`interface TablePlugin {
  name: string;
  dependencies?: string[];
  init?(ctx: TableContext): void | (() => void);
  transformQuery?(sql: string): string;
  transformColumns?(columns: ResolvedColumn[]): ResolvedColumn[];
  transformRows?(rows: Row[]): Row[];
  shortcuts?: Record<string, (ctx: TableContext) => void>;
  contextMenuItems?: (ctx: TableContext, cell: CellRef) => MenuItem[];
  headerContextMenuItems?: (ctx: TableContext, column: ResolvedColumn) => MenuItem[];
  renderAbove?(ctx: TableContext): ReactNode;
  renderBelow?(ctx: TableContext): ReactNode;
  renderFooter?(ctx: TableContext): ReactNode;
  renderOverlay?(ctx: TableContext): ReactNode;
}`} language="tsx" />

      <Heading level={2} id="composition">Composition</Heading>
      <CodeBlock code={`// Plugins are composed as an array
<Table
  db={db}
  table="employees"
  plugins={[filters(), selection('multi'), columnResize(), contextMenu()]}
/>`} language="tsx" />

      <Callout type="info" title="Plugin Lifecycle">
        Each plugin's <code>init()</code> is called with the full <code>TableContext</code>.
        Return a cleanup function to run when the table unmounts.
      </Callout>

      <Heading level={2} id="execution-order">Execution Order</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Plugins run in the order they appear in the array. This matters when plugins interact — for
        example, <code>clipboard()</code> reads from the current selection, so <code>selection()</code> should
        come first. Similarly, <code>keyboard()</code> relies on knowing which cell is selected to
        handle arrow-key navigation.
      </p>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Each plugin can declare a <code>dependencies</code> array listing the plugin names it requires.
        If a dependency is missing from the plugins list, the system logs a warning at init time so
        you can catch misconfiguration early.
      </p>
      <Callout type="info" title="Dependency example">
        <code>clipboard()</code> declares <code>{`dependencies: ['selection']`}</code>. If you forget to
        include <code>selection()</code>, you'll see a console warning explaining which dependency is missing.
      </Callout>

      <Heading level={2} id="custom">Writing a Custom Plugin</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        A plugin is a factory function that returns a <code>TablePlugin</code> object.
        Here's a complete example — a row counter that shows the total in the footer
        and logs on data changes:
      </p>
      <CodeBlock code={`function rowCounter(): TablePlugin {
  return {
    name: 'rowCounter',

    init(ctx) {
      // Subscribe to data events — runs after every query
      const unsub = ctx.on('data', () => {
        console.log('Rows loaded:', ctx.getLatest().totalCount);
      });
      // Return cleanup to unsubscribe on unmount
      return unsub;
    },

    renderFooter(ctx) {
      return (
        <div style={{ padding: '4px 12px', fontSize: 12, opacity: 0.7 }}>
          {ctx.totalCount} rows{ctx.isLoading ? ' (loading...)' : ''}
        </div>
      );
    },
  };
}

// Use it like any built-in plugin
<Table db={db} table="trades" plugins={[rowCounter(), filters()]} />`} language="tsx" />

      <p className="text-[13px] mb-3 mt-6" style={{ color: "var(--doc-text-secondary)" }}>
        Plugins can also add keyboard shortcuts and context menu items. This example adds
        a "Copy row as JSON" option to the right-click menu:
      </p>
      <CodeBlock code={`function copyRowJson(): TablePlugin {
  return {
    name: 'copyRowJson',
    dependencies: ['selection'],

    shortcuts: {
      'Ctrl+Shift+J': (ctx) => {
        const { activeCell, rows } = ctx.getLatest();
        if (activeCell) {
          const row = rows[activeCell.rowIndex];
          navigator.clipboard.writeText(JSON.stringify(row, null, 2));
        }
      },
    },

    contextMenuItems: (ctx, cell) => [
      {
        label: 'Copy row as JSON',
        action: () => {
          const row = ctx.rows[cell.rowIndex];
          if (row) navigator.clipboard.writeText(JSON.stringify(row, null, 2));
        },
      },
    ],
  };
}`} language="tsx" />

      <Heading level={3} id="patterns">Key Patterns</Heading>
      <ul className="text-[13px] mb-6 list-disc pl-5 space-y-1" style={{ color: "var(--doc-text-secondary)" }}>
        <li>Always <strong style={{ color: "var(--doc-text)" }}>return a cleanup function</strong> from <code>init()</code> to prevent memory leaks on unmount.</li>
        <li>Use <strong style={{ color: "var(--doc-text)" }}><code>ctx.getLatest()</code></strong> in async or deferred callbacks — closures capture a stale <code>ctx</code>.</li>
        <li>Declare <strong style={{ color: "var(--doc-text)" }}><code>dependencies</code></strong> if your plugin reads state from another plugin (e.g. selection).</li>
        <li><code>transformColumns</code> and <code>transformRows</code> must return <strong style={{ color: "var(--doc-text)" }}>new arrays</strong> — they are pure transforms, not mutations.</li>
      </ul>

      <Heading level={2} id="available">Available Plugins</Heading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
        {PLUGINS.map((p) => (
          <Link
            key={p.path}
            to={p.path}
            className="flex items-center gap-3 px-4 py-3 rounded-lg no-underline"
            style={{ border: `1px solid ${border}` }}
          >
            <span className="font-mono text-[13px]" style={{ color: accent }}>{p.name}()</span>
            <span className="text-[12px]" style={{ color: textSec }}>{p.desc}</span>
          </Link>
        ))}
      </div>
      <PageNav />
    </div>
  );
}
