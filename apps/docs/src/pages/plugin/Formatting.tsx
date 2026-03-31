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
      <CodeBlock code={`// Apply formatting rules to columns
ctx.formatting.setRules('pnl', [
  { type: 'negative', style: { color: '#ef4444' } },
  { type: 'positive', style: { color: '#22c55e' } },
  { type: 'threshold', value: 1000000, style: { fontWeight: 'bold' } },
]);`} language="tsx" />

      <Heading level={2} id="rule-types">Rule Types</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        <code>negative</code> applies when the cell value is less than zero.
        <code>positive</code> applies when the value is greater than zero.
        <code>threshold</code> applies when the value exceeds the specified threshold.
        Multiple rules can be combined on a single column.
      </p>
      <PageNav />
    </div>
  );
}
