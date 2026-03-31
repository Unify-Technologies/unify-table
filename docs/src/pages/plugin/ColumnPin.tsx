import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { Example } from "../../components/Example";
import { CodeBlock } from "../../components/CodeBlock";
import { Callout } from "../../components/Callout";
import { PageNav } from "../../components/PageNav";

export default function ColumnPinPlugin() {
  return (
    <div>
      <PageTitle>Column Pin</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Pin columns to the left or right edge of the table so they remain visible during horizontal scrolling.
      </p>

      <Heading level={2} id="usage">Usage</Heading>
      <CodeBlock code={`import { Table, columnPin } from '@unify/table-react';

<Table db={db} table="trades" plugins={[columnPin()]} />`} language="tsx" />

      <Heading level={2} id="example">Example</Heading>
      <Example id="with-column-pin" description="Scroll horizontally — Ticker stays pinned on the left, PnL on the right." height={350} />

      <Heading level={2} id="pinning">Pinning Columns</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Right-click a column header and select "Pin Left" or "Pin Right" from the context
        menu. Pinned columns stay fixed at the edge while the rest of the table scrolls.
        Select "Unpin" to restore normal scrolling behavior.
      </p>

      <Callout type="tip" title="When to pin">
        Pin identifier columns (name, ticker, ID) so users always see which row they're looking at while scrolling through many columns. Combine with{" "}
        <a href="#/plugins/column-resize" style={{color: "var(--doc-accent)"}}>columnResize()</a> and{" "}
        <a href="#/plugins/column-reorder" style={{color: "var(--doc-accent)"}}>columnReorder()</a> for full column management.
      </Callout>

      <Heading level={2} id="programmatic">Programmatic Pinning</Heading>
      <CodeBlock code={`// Pin columns via column definitions
const columns = [
  { field: 'ticker', pin: 'left' },
  { field: 'total', pin: 'right' },
];`} language="tsx" />
      <PageNav />
    </div>
  );
}
