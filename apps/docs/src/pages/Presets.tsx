import { PageTitle } from "../components/PageTitle";
import { Heading } from "../components/Heading";
import { Example } from "../components/Example";
import { CodeBlock } from "../components/CodeBlock";
import { Callout } from "../components/Callout";
import { useTheme } from "../providers/ThemeProvider";
import { PageNav } from "../components/PageNav";

const PRESET_PLUGINS = [
  { plugin: "filters", spreadsheet: true, dataViewer: true, readOnly: true },
  { plugin: "selection", spreadsheet: "range", dataViewer: "multi", readOnly: false },
  { plugin: "editing", spreadsheet: true, dataViewer: false, readOnly: false },
  { plugin: "keyboard", spreadsheet: true, dataViewer: false, readOnly: false },
  { plugin: "clipboard", spreadsheet: true, dataViewer: false, readOnly: false },
  { plugin: "columnResize", spreadsheet: true, dataViewer: true, readOnly: true },
  { plugin: "columnReorder", spreadsheet: true, dataViewer: true, readOnly: false },
  { plugin: "contextMenu", spreadsheet: true, dataViewer: false, readOnly: false },
  { plugin: "rowGrouping", spreadsheet: false, dataViewer: true, readOnly: false },
  { plugin: "views", spreadsheet: false, dataViewer: true, readOnly: false },
  { plugin: "formatting", spreadsheet: true, dataViewer: true, readOnly: true },
  { plugin: "statusBar", spreadsheet: true, dataViewer: true, readOnly: false },
];

export default function Presets() {
  const { dark } = useTheme();
  const border = dark ? "var(--doc-border)" : "var(--color-border)";
  const textSec = "var(--doc-text-secondary)";
  const textMuted = "var(--doc-text-muted)";

  return (
    <div>
      <PageTitle>Presets</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: textSec }}>
        Pre-configured plugin bundles for common use cases.
      </p>

      <p className="text-[13px] mb-3" style={{ color: textSec }}>
        The plugin pages showed how to compose features one by one. Presets bundle them for common
        use cases — instead of assembling plugins individually, pick a preset and customize from
        there. Each preset returns a standard plugin array, so you can spread it and add or override
        individual plugins as needed.
      </p>
      <Callout type="tip" title="Start with a preset, then customize">
        Presets are just functions that return <code>TablePlugin[]</code>. You can use the spread
        operator to extend them: <code>{`[...spreadsheet(), myCustomPlugin()]`}</code>.
      </Callout>

      <Heading level={2} id="comparison">Comparison</Heading>
      <p className="text-[13px] mb-4" style={{ color: textSec }}>
        Each preset targets a different use case. The table below shows which plugins are included in each.
      </p>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-[12px]" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${border}` }}>
              <th className="text-left py-2 px-3 font-semibold" style={{ color: textSec }}>Plugin</th>
              <th className="text-center py-2 px-3 font-semibold" style={{ color: textSec }}>spreadsheet()</th>
              <th className="text-center py-2 px-3 font-semibold" style={{ color: textSec }}>dataViewer()</th>
              <th className="text-center py-2 px-3 font-semibold" style={{ color: textSec }}>readOnly()</th>
            </tr>
          </thead>
          <tbody>
            {PRESET_PLUGINS.map((row) => (
              <tr key={row.plugin} style={{ borderBottom: `1px solid ${border}` }}>
                <td className="py-1.5 px-3 font-mono" style={{ color: textSec }}>{row.plugin}</td>
                {[row.spreadsheet, row.dataViewer, row.readOnly].map((val, i) => (
                  <td key={i} className="text-center py-1.5 px-3" style={{ color: val ? textSec : textMuted }}>
                    {val === false ? "\u2014" : val === true ? "\u2713" : typeof val === "string" ? val : "\u2713"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Heading level={2} id="spreadsheet">spreadsheet()</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Full editing experience: editing, clipboard, keyboard, filters, context menu, selection (range), column resize/reorder, formatting, status bar.
      </p>
      <Example id="preset-spreadsheet" title="Spreadsheet Preset" description="Double-click cells to edit, Ctrl+C/V to copy/paste, right-click for context menu. PnL is color-coded green/red." height={400} />

      <Heading level={2} id="data-viewer">dataViewer()</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Analytics-oriented: filters, selection (multi), column resize/reorder, row grouping, views, formatting, status bar.
      </p>
      <Example id="preset-data-viewer" title="Data Viewer Preset" description="Switch between table, chart, timeline, and pivot views. Group by desk, filter by ticker — all displays update together." height={400} />

      <Heading level={2} id="read-only">readOnly()</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Minimal: filters, column resize, formatting. No editing, no selection.
      </p>
      <Example id="preset-read-only" title="Read Only Preset" description="Pre-sorted by PnL descending. Color-coded profit/loss and notional tiers. Sort and filter — no editing." height={400} />

      <Heading level={2} id="custom">Custom Presets</Heading>
      <CodeBlock code={`// Create your own preset by combining plugins
function myPreset(): TablePlugin[] {
  return [
    filters(),
    selection('multi'),
    columnResize(),
    rowGrouping(),
    statusBar(),
  ];
}`} language="tsx" />
      <PageNav />
    </div>
  );
}
