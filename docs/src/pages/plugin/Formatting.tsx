import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { Example } from "../../components/Example";
import { CodeBlock } from "../../components/CodeBlock";
import { PageNav } from "../../components/PageNav";

export default function FormattingPlugin() {
  return (
    <div>
      <PageTitle>Formatting</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Conditional cell formatting with threshold, negative, and positive value rules.
      </p>

      <Heading level={2} id="usage">Usage</Heading>
      <CodeBlock code={`import { Table, formatting } from '@unify/table-react';

<Table db={db} table="portfolio" plugins={[formatting()]} />`} language="tsx" />

      <Heading level={2} id="example">Example</Heading>
      <Example id="with-formatting" description="Green PnL = profit, red = loss. Amber notional = mid-range. Bold purple volume = high-volume trades. Three formatting techniques combined." height={350} />

      <Heading level={2} id="rules">Formatting Rules</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Pass a rules map to <code>formatting()</code> at creation time. Each key is a column
        field name (or <code>'*'</code> for all columns), and the value is an array
        of <code>ConditionalRule</code> objects. Three helpers produce common rules:
      </p>
      <CodeBlock code={`import { formatting, positive, negative, threshold } from '@unify/table-react';

<Table
  db={db}
  table="portfolio"
  plugins={[
    formatting({
      pnl: [...positive('#22c55e'), ...negative('#ef4444')],
      notional: threshold([
        { max: 100000, style: { color: '#f59e0b' } },
        { max: 500000, style: { color: '#22c55e', fontWeight: 'bold' } },
      ]),
    }),
  ]}
/>`} language="tsx" />

      <Heading level={2} id="rule-types">Rule Types</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        <code>negative(color?)</code> applies when the cell value is &lt; 0.{" "}
        <code>positive(color?)</code> applies when &gt; 0.{" "}
        <code>threshold(ranges)</code> applies styles based on value ranges.
        For custom logic, write a rule directly with a <code>when</code> function:
      </p>
      <CodeBlock code={`formatting({
  status: [
    { when: (value) => value === 'Active', style: { color: '#22c55e' } },
    { when: (value) => value === 'Inactive', style: { color: '#ef4444' } },
  ],
})`} language="tsx" />
      <PageNav />
    </div>
  );
}
