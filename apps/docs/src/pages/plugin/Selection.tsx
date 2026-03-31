import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { Example } from "../../components/Example";
import { CodeBlock } from "../../components/CodeBlock";
import { Callout } from "../../components/Callout";
import { PageNav } from "../../components/PageNav";

export default function SelectionPlugin() {
  return (
    <div>
      <PageTitle>Selection</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Enables single, multi, or range cell selection with keyboard and mouse support.
      </p>

      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The selection plugin supports three modes, each enabling different interaction patterns.
        <strong> Single</strong> mode selects one cell at a time — clicking a new cell deselects the
        previous one. <strong> Multi</strong> mode lets users build up a set of individually selected
        cells using Ctrl/Cmd+click. <strong> Range</strong> mode enables rectangular region selection
        via Shift+click or click-and-drag, similar to spreadsheet behavior.
      </p>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Selection state is used by other plugins: <code>clipboard()</code> copies from the current
        selection, <code>editing()</code> activates on the selected cell, and <code>statusBar()</code> shows
        aggregations for the selected range.
      </p>

      <Callout type="info">See selection in action in the <a href="#/demo" style={{color: "var(--doc-accent)"}}>Interactive Demo</a> — click, Shift+click, and Ctrl+click cells in any table panel.</Callout>

      <Heading level={2} id="usage">Usage</Heading>
      <CodeBlock code={`import { Table, selection } from '@unify/table-react';

// Single cell selection (default)
<Table db={db} table="orders" plugins={[selection()]} />

// Multi-select with Ctrl/Cmd click
<Table db={db} table="orders" plugins={[selection('multi')]} />

// Range selection with Shift+click
<Table db={db} table="orders" plugins={[selection('range')]} />`} language="tsx" />

      <Heading level={2} id="example">Example</Heading>
      <Example id="with-selection" description="Click and drag across the PnL column. The status bar shows sum, average, and count of your selection." height={350} />

      <Heading level={2} id="modes">Selection Modes</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        <code>single</code> selects one cell at a time. <code>multi</code> allows toggling
        individual cells with Ctrl/Cmd+click. <code>range</code> enables rectangular selection
        via Shift+click or Shift+arrow keys.
      </p>

      <Heading level={2} id="when-to-use">When to Use Each Mode</Heading>
      <Callout type="tip" title="Choosing a selection mode">
        <p><strong>single</strong> — Best for detail panels or master-detail layouts where clicking a row
        shows its details elsewhere. Keeps the interaction simple and unambiguous.</p>
        <p><strong>multi</strong> — Ideal for batch operations like "delete selected rows" or "tag these
        items." Users can Ctrl/Cmd+click to cherry-pick non-contiguous cells.</p>
        <p><strong>range</strong> — The default for spreadsheet-like experiences. Supports copy/paste of
        rectangular regions and shows aggregate stats (sum, count, average) in the status bar for the
        selected area.</p>
      </Callout>
      <PageNav />
    </div>
  );
}
