import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { CodeBlock } from "../../components/CodeBlock";
import { Callout } from "../../components/Callout";
import { PropTable } from "../../components/PropTable";
import { PageNav } from "../../components/PageNav";

export default function KeyboardPlugin() {
  return (
    <div>
      <PageTitle>Keyboard</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Adds keyboard navigation with arrow keys, Tab, Enter, Escape, Delete, and Ctrl shortcuts.
      </p>

      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The keyboard plugin makes the table fully navigable without a mouse. Arrow keys move between cells, Tab advances
        to the next cell (wrapping to the next row), Enter starts editing, and Escape cancels. It's the glue that connects{" "}
        <a href="#/plugins/selection" style={{color: "var(--doc-accent)"}}>selection</a>,{" "}
        <a href="#/plugins/editing" style={{color: "var(--doc-accent)"}}>editing</a>, and{" "}
        <a href="#/plugins/clipboard" style={{color: "var(--doc-accent)"}}>clipboard</a> into a cohesive spreadsheet-like experience.
      </p>

      <Callout type="info" title="Included in spreadsheet preset">
        The keyboard plugin is included in the <code>spreadsheet()</code> preset. When
        using <code>dataViewer()</code> or <code>readOnly()</code>, add it explicitly if you want
        keyboard navigation.
      </Callout>

      <Heading level={2} id="usage">Usage</Heading>
      <CodeBlock code={`import { Table, keyboard } from '@unify/table-react';

<Table db={db} table="tasks" plugins={[keyboard()]} />`} language="tsx" />

      <Heading level={2} id="shortcuts">Shortcuts</Heading>
      <PropTable rows={[
        { name: "Arrow keys", type: "", description: "Move selection between cells" },
        { name: "Tab / Shift+Tab", type: "", description: "Move to next/previous cell, wrapping at row boundaries" },
        { name: "Enter", type: "", description: "Begin editing the selected cell (requires editing plugin)" },
        { name: "Escape", type: "", description: "Cancel editing or clear selection" },
        { name: "Delete", type: "", description: "Clear cell contents (requires editing plugin)" },
        { name: "Ctrl+A", type: "", description: "Select all cells" },
        { name: "Ctrl+C / Ctrl+V", type: "", description: "Copy/paste (requires clipboard plugin)" },
        { name: "Ctrl+Z", type: "", description: "Undo last edit (requires editing plugin)" },
        { name: "Shift+Arrow", type: "", description: "Extend selection range (requires selection('range'))" },
      ]} />

      <Heading level={2} id="custom-shortcuts">Custom Shortcuts</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Plugins can register additional keyboard shortcuts via the <code>shortcuts</code> property. Each shortcut maps a key combination to a handler that receives the table context.
      </p>
      <CodeBlock code={`const myPlugin = {
  name: 'myPlugin',
  shortcuts: {
    'Ctrl+Shift+S': (ctx) => saveSnapshot(ctx),
    'Ctrl+Shift+E': (ctx) => exportSelection(ctx),
  },
};`} language="tsx" />
      <PageNav />
    </div>
  );
}
