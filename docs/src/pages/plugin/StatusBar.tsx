import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { Example } from "../../components/Example";
import { CodeBlock } from "../../components/CodeBlock";
import { PageNav } from "../../components/PageNav";

export default function StatusBarPlugin() {
  return (
    <div>
      <PageTitle>Status Bar</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Enriches the table footer with selection-based aggregations like sum, average, count, min, and max.
      </p>

      <Heading level={2} id="usage">Usage</Heading>
      <CodeBlock code={`import { Table, statusBar } from '@unify/table-react';

<Table db={db} table="transactions" plugins={[statusBar()]} />`} language="tsx" />

      <Heading level={2} id="example">Example</Heading>
      <Example id="with-status-bar" description="Select a range of PnL cells — the status bar shows sum, average, min, max, and count. PnL is color-coded green/red." height={350} />

      <Heading level={2} id="behavior">Behavior</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        When cells are selected, the footer displays aggregation values computed from
        the selected range. For numeric columns this includes sum, average, min, and max.
        For all columns, the count of selected cells is shown. Aggregations update
        reactively as the selection changes.
      </p>
      <PageNav />
    </div>
  );
}
