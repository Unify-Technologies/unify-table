import { PageTitle } from "../components/PageTitle";
import { Heading } from "../components/Heading";
import { CodeBlock } from "../components/CodeBlock";
import { Callout } from "../components/Callout";
import { Link } from "../router";
import { useTheme } from "../providers/ThemeProvider";
import { PageNav } from "../components/PageNav";

const DISPLAYS = [
  { name: "chart", path: "/displays/chart", desc: "Bar, line, area, pie, donut, scatter, histogram, heatmap, treemap, funnel" },
  { name: "stats", path: "/displays/stats", desc: "Summary statistic cards with aggregations" },
  { name: "pivot", path: "/displays/pivot", desc: "Cross-tabulation matrix with row/column totals" },
  { name: "summary", path: "/displays/summary", desc: "Auto-profile every column via DuckDB SUMMARIZE" },
  { name: "correlation", path: "/displays/correlation", desc: "Pairwise Pearson correlation heatmap" },
  { name: "timeline", path: "/displays/timeline", desc: "Time-bucketed chart using date_trunc" },
  { name: "outliers", path: "/displays/outliers", desc: "IQR/z-score detection with box plot" },
];

const USE_CASE_GUIDE = [
  { display: "chart", useCase: "Compare values, show trends, or visualize distributions", example: "Revenue by category, monthly growth" },
  { display: "stats", useCase: "Quick KPIs and headline numbers", example: "Total revenue, average order size, record count" },
  { display: "pivot", useCase: "Cross-tabulate two dimensions", example: "Sales by region and product category" },
  { display: "summary", useCase: "Profile and understand your dataset", example: "Column types, null rates, value distributions" },
  { display: "correlation", useCase: "Find relationships between numeric variables", example: "Price vs. quantity, discount vs. revenue" },
  { display: "timeline", useCase: "Track how a metric changes over time", example: "Monthly orders, daily active users" },
  { display: "outliers", useCase: "Detect anomalous values in a numeric column", example: "Unusually large orders, price spikes" },
];

export default function DisplayOverview() {
  const { dark } = useTheme();
  const border = dark ? "var(--doc-border)" : "var(--color-border)";
  const accent = dark ? "var(--doc-accent)" : "var(--color-accent)";
  const textSec = dark ? "var(--doc-text-secondary)" : "var(--color-text-secondary)";
  const mutedText = dark ? "var(--doc-text-muted)" : "var(--color-text-muted)";

  return (
    <div>
      <PageTitle>Displays</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: textSec }}>
        Alternative visualizations for your table data. Switch between table view and displays.
      </p>

      <Callout type="info">See all display types in action in the <a href="#/demo" style={{color: "var(--doc-accent)"}}>Interactive Demo</a> — each panel showcases a different display mode.</Callout>

      <Heading level={2} id="when-to-use">When to Use Displays</Heading>
      <p className="text-[13px] mb-3" style={{ color: textSec }}>
        Displays transform the same underlying data into different visual formats — without leaving the table context.
        Switch from a data grid to a chart, stats summary, or pivot table with a single click. Because displays
        share the same data source, any active filters, sorts, or groupings carry over automatically.
      </p>
      <Callout type="tip" title="One data source, many views">
        Displays are not separate pages or routes. They are alternative renderings of the same query result.
        This means you can filter your data in table view, then flip to a chart to visualize the filtered subset.
      </Callout>

      <Heading level={2} id="architecture">Two-Layer Architecture</Heading>
      <p className="text-[13px] mb-3" style={{ color: textSec }}>
        Each display is split into two layers that can be used independently:
      </p>
      <ul className="text-[13px] mb-4 space-y-2 list-disc list-inside" style={{ color: textSec }}>
        <li>
          <strong>Core <code>DisplayType</code></strong> (in <code>@unify/table-core</code>) — defines the SQL builder,
          default config, and validation logic. This layer has zero dependencies and can run in any JS environment.
        </li>
        <li>
          <strong>React <code>DisplayDescriptor</code></strong> (in <code>@unify/table-react</code>) — provides the
          rendering component, config UI panel, and icon. This layer depends on React and the charts package.
        </li>
      </ul>
      <p className="text-[13px] mb-3" style={{ color: mutedText }}>
        This separation means you can use the SQL builders from core to generate display queries server-side,
        or build your own rendering layer on top of the core types.
      </p>

      <Heading level={2} id="usage">Adding Displays</Heading>
      <p className="text-[13px] mb-3" style={{ color: textSec }}>
        Pass an array of display definitions to the <code>displays</code> prop. Each display needs a unique <code>id</code>,
        a <code>type</code> matching one of the seven built-in displays, and a <code>config</code> object specific to that type.
      </p>
      <CodeBlock code={`<Table
  db={db}
  table="orders"
  plugins={dataViewer()}
  displays={[
    {
      id: 'my-chart',
      type: 'chart',
      label: 'Revenue Chart',
      config: { type: 'bar', x: 'category', y: { field: 'amount', agg: 'sum' } },
    },
  ]}
/>`} language="tsx" />

      <Heading level={2} id="custom">Writing a Custom Display</Heading>
      <p className="text-[13px] mb-3" style={{ color: textSec }}>
        Custom displays follow the same two-layer pattern as built-ins. Define a core <code>DisplayType</code> (SQL
        builder, config, validation), then a React <code>DisplayDescriptor</code> (rendering + config UI).
      </p>

      <Heading level={3} id="custom-core">Step 1 — Core type</Heading>
      <p className="text-[13px] mb-3" style={{ color: textSec }}>
        The core type has no React dependency — it generates SQL and defines configuration. This example
        creates a "Top N" display that shows the highest values in a column as cards.
      </p>
      <CodeBlock code={`import { DisplayType, quoteIdent } from '@unify/table-core';

interface TopNConfig {
  field: string;
  labelField: string;
  agg: 'sum' | 'avg' | 'max';
  limit: number;
}

const topNDisplayType: DisplayType<TopNConfig> = {
  key: 'top-n',
  label: 'Top N',
  description: 'Show the N highest values',

  buildSql(viewName, config) {
    return \`SELECT \${quoteIdent(config.labelField)} AS label,
      \${config.agg.toUpperCase()}(\${quoteIdent(config.field)}) AS value
      FROM \${quoteIdent(viewName)}
      GROUP BY \${quoteIdent(config.labelField)}
      ORDER BY value DESC LIMIT \${config.limit}\`;
  },

  defaultConfig(columns) {
    const num = columns.find(c => c.mappedType === 'number');
    const str = columns.find(c => c.mappedType === 'string');
    return { field: num?.name ?? '', labelField: str?.name ?? '', agg: 'sum', limit: 5 };
  },

  validate(config) {
    if (!config.field) return ['Value field is required'];
    if (!config.labelField) return ['Label field is required'];
    return null;
  },
};`} language="tsx" />

      <Heading level={3} id="custom-react">Step 2 — React descriptor</Heading>
      <p className="text-[13px] mb-3" style={{ color: textSec }}>
        The descriptor provides the render component and config panel. Use <code>useDisplayData(sql, engine)</code> to
        fetch results from the SQL the core type generated.
      </p>
      <CodeBlock code={`import { registerDisplayType, registerDisplay, useDisplayData } from '@unify/table-react';
import type { DisplayRenderProps, DisplayConfigProps } from '@unify/table-react';

function TopNRender({ sql, engine }: DisplayRenderProps<TopNConfig>) {
  const { rows, isLoading } = useDisplayData(sql, engine);
  if (isLoading) return <div>Loading...</div>;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: 12 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #333' }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{String(r.value)}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{String(r.label)}</div>
        </div>
      ))}
    </div>
  );
}

function TopNConfigPanel({ config, onChange, columns }: DisplayConfigProps<TopNConfig>) {
  const numCols = columns.filter(c => c.mappedType === 'number');
  const strCols = columns.filter(c => c.mappedType === 'string');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label>Value field:
        <select value={config.field} onChange={e => onChange({ ...config, field: e.target.value })}>
          {numCols.map(c => <option key={c.name}>{c.name}</option>)}
        </select>
      </label>
      <label>Label field:
        <select value={config.labelField} onChange={e => onChange({ ...config, labelField: e.target.value })}>
          {strCols.map(c => <option key={c.name}>{c.name}</option>)}
        </select>
      </label>
    </div>
  );
}

// Register both layers — call once at app startup
registerDisplayType(topNDisplayType);
registerDisplay({ type: topNDisplayType, render: TopNRender, renderConfig: TopNConfigPanel });`} language="tsx" />

      <Heading level={3} id="custom-use">Step 3 — Use it</Heading>
      <CodeBlock code={`<Table
  db={db}
  table="trades"
  displays={[{
    id: 'top-tickers',
    type: 'top-n',
    label: 'Top Tickers by PnL',
    config: { field: 'pnl', labelField: 'ticker', agg: 'sum', limit: 5 },
  }]}
/>`} language="tsx" />

      <p className="text-[13px] mb-3 mt-4" style={{ color: mutedText }}>
        <strong style={{ color: textSec }}>Core layer</strong> defines the SQL — testable without React.{" "}
        <strong style={{ color: textSec }}>React layer</strong> renders results and provides a config panel.{" "}
        <code>useDisplayData(sql, engine)</code> handles fetching, loading state, and caching.{" "}
        <code>validate()</code> prevents broken queries from running.
      </p>

      <Heading level={2} id="choosing">Choosing a Display</Heading>
      <p className="text-[13px] mb-4" style={{ color: textSec }}>
        Each display type is designed for a specific analytical task. Use the guide below to pick the right one.
      </p>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-[13px] border-collapse" style={{ color: textSec }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${border}` }}>
              <th className="text-left py-2 pr-4 font-semibold">Display</th>
              <th className="text-left py-2 pr-4 font-semibold">Best for</th>
              <th className="text-left py-2 font-semibold" style={{ color: mutedText }}>Example</th>
            </tr>
          </thead>
          <tbody>
            {USE_CASE_GUIDE.map((row) => (
              <tr key={row.display} style={{ borderBottom: `1px solid ${border}` }}>
                <td className="py-2 pr-4 font-mono" style={{ color: accent }}>{row.display}</td>
                <td className="py-2 pr-4">{row.useCase}</td>
                <td className="py-2" style={{ color: mutedText }}>{row.example}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Heading level={2} id="available">Available Displays</Heading>
      <div className="grid grid-cols-1 gap-2 mt-4">
        {DISPLAYS.map((d) => (
          <Link
            key={d.path}
            to={d.path}
            className="flex items-center gap-3 px-4 py-3 rounded-lg no-underline"
            style={{ border: `1px solid ${border}` }}
          >
            <span className="font-mono text-[13px]" style={{ color: accent }}>{d.name}</span>
            <span className="text-[12px]" style={{ color: textSec }}>{d.desc}</span>
          </Link>
        ))}
      </div>
      <PageNav />
    </div>
  );
}
