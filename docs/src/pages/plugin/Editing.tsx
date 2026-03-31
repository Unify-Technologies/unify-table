import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { Example } from "../../components/Example";
import { CodeBlock } from "../../components/CodeBlock";
import { Callout } from "../../components/Callout";
import { PageNav } from "../../components/PageNav";

export default function EditingPlugin() {
  return (
    <div>
      <PageTitle>Editing</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Inline cell editing with validation. Double-click or press Enter to start editing.
      </p>

      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The editing plugin turns your table into a spreadsheet. Double-click a cell or start typing
        to enter edit mode. Changes follow commit/cancel semantics — press Enter or Tab to confirm,
        Escape to discard. Every confirmed edit is written directly to DuckDB via an UPDATE statement,
        so your data source stays in sync without manual refresh.
      </p>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Column definitions can include validation rules that run before a commit. If validation
        fails, the cell reverts and the user sees the error — no bad data reaches the database.
      </p>

      <Heading level={2} id="usage">Usage</Heading>
      <CodeBlock code={`import { Table, editing } from '@unify/table-react';

<Table db={db} table="employees" plugins={[editing()]} />`} language="tsx" />

      <Heading level={2} id="example">Example</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The same trade data, now with <code>editing()</code>, <code>keyboard()</code>, and <code>selection('range')</code>.
        Column definitions specify the editor type and validation rules for each field.
      </p>
      <Example id="with-editing" description="Double-click any cell to edit. Ticker and Desk use select dropdowns. PnL validates numeric input. Tab moves between cells." height={350} />

      <Heading level={2} id="validation">Validation</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Column definitions can include a <code>validate</code> function that receives the new
        value and returns <code>true</code> or an error message string. Invalid edits are
        rejected and the cell reverts to its previous value.
      </p>
      <CodeBlock code={`const columns = [
  {
    field: 'price',
    validate: (value: unknown) => {
      if (typeof value !== 'number' || value < 0)
        return 'Price must be a positive number';
      return true;
    },
  },
  {
    field: 'email',
    validate: (value: unknown) =>
      typeof value === 'string' && value.includes('@')
        ? true
        : 'Invalid email address',
  },
];`} language="tsx" />
      <Callout type="info" title="Type-aware editing">
        The editor adapts its input to the column type. Numeric columns show a number input,
        boolean columns toggle directly, and text columns use a standard text field. Type
        coercion happens automatically before validation runs.
      </Callout>

      <Heading level={2} id="controls">Controls</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Press <code>Enter</code> or <code>Tab</code> to confirm. Press <code>Escape</code> to
        cancel. Changes are committed to the underlying DuckDB table via an UPDATE statement.
      </p>
      <PageNav />
    </div>
  );
}
