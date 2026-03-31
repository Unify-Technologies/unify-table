import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { Example } from "../../components/Example";
import { CodeBlock } from "../../components/CodeBlock";
import { Callout } from "../../components/Callout";
import { PageNav } from "../../components/PageNav";

export default function ContextMenuPlugin() {
  return (
    <div>
      <PageTitle>Context Menu</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Right-click menus with nested submenus. Other plugins can contribute menu items.
      </p>

      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The context menu plugin provides a right-click menu system for the table. It collects menu
        items from all active plugins, so the menu naturally grows as you add capabilities — include
        the clipboard plugin and you get Copy/Paste entries; include tableIO and you get Export
        options. Each plugin's items are separated visually, and items can nest into submenus for
        complex operations.
      </p>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        You can also define fully custom menu items in your own plugins by implementing
        the <code>contextMenuItems</code> hook, which receives the table context and the cell that
        was right-clicked.
      </p>

      <Heading level={2} id="usage">Usage</Heading>
      <CodeBlock code={`import { Table, contextMenu } from '@unify/table-react';

<Table db={db} table="orders" plugins={[contextMenu()]} />`} language="tsx" />

      <Heading level={2} id="example">Example</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        This example combines <code>contextMenu()</code> with <code>clipboard()</code>,
        <code>selection()</code>, <code>editing()</code>, and <code>keyboard()</code> —
        notice how the menu items change based on which plugins are active.
      </p>
      <Example id="with-context-menu" description="Right-click on a cell, a column header, or a multi-selection to see contextual actions." height={350} />

      <Heading level={2} id="custom-items">Custom Menu Items</Heading>
      <CodeBlock code={`// Plugins contribute items via contextMenuItems
const myPlugin = {
  name: 'audit',
  contextMenuItems: (ctx, cell) => [
    { label: 'View history', action: () => showHistory(cell) },
    {
      label: 'Export',
      children: [
        { label: 'As CSV', action: () => exportCsv(ctx) },
        { label: 'As JSON', action: () => exportJson(ctx) },
      ],
    },
  ],
};`} language="tsx" />
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Menu items from all active plugins are collected and separated automatically.
        Items can include nested <code>children</code> arrays for submenus.
      </p>
      <Callout type="tip" title="Built-in items from other plugins">
        You don't need to wire up common actions manually. When <code>clipboard()</code> is active, the
        context menu automatically includes Copy and Paste. When <code>tableIO()</code> is active,
        Export as CSV/JSON/Parquet appears. The context menu acts as a hub for all plugin-provided
        actions.
      </Callout>
      <PageNav />
    </div>
  );
}
