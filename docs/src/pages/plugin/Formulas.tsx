import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { CodeBlock } from "../../components/CodeBlock";
import { Example } from "../../components/Example";
import { Callout } from "../../components/Callout";
import { PageNav } from "../../components/PageNav";

export default function FormulasPlugin() {
  return (
    <div>
      <PageTitle>Formulas</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Add computed columns that evaluate SQL expressions on each row. Formula columns are fully reactive &mdash; when you edit a source column, the formula recalculates automatically.
      </p>

      <Heading level={2} id="how-it-works">How It Works</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Formula columns are injected as computed expressions in the DuckDB <code>SELECT</code> clause. They run server-side inside DuckDB-WASM, so all DuckDB functions, type casts, and <code>CASE</code> expressions are available. Formula columns are <strong>read-only</strong> &mdash; they cannot be directly edited since their value is derived from other columns.
      </p>
      <p className="text-[13px] mb-6" style={{ color: "var(--doc-text-secondary)" }}>
        Formula columns are visually indicated with a <strong>&Sigma; icon</strong> in the column header. When a formula is marked <code>editable: true</code>, it also shows a <strong>pencil icon</strong> to indicate the user can edit its expression at runtime.
      </p>

      <Heading level={2} id="example">Example</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Three formula columns: <strong>PnL/Unit</strong> (editable), <strong>Year</strong> (read-only), and <strong>Margin %</strong> (editable). Editable formulas show both &Sigma; and pencil icons &mdash; double-click them to modify the expression. Try editing source columns (<code>pnl</code>, <code>volume</code>, <code>notional</code>) to see formulas recalculate.
      </p>
      <Example
        id="with-formulas"
        title="Formulas with Editing & Fill Handle"
        description={<>Full spreadsheet experience with three computed columns. <strong>PnL/Unit</strong> and <strong>Margin %</strong> are editable &mdash; double-click to modify the expression. <strong>Year</strong> is read-only. Edit source columns and watch formulas recalculate.</>}
        height={480}
      />

      <Heading level={2} id="usage">Usage</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Pass formula column definitions to the <code>formulas()</code> plugin. Each column needs a <code>name</code> (the output column name) and an <code>expression</code> (any valid DuckDB SQL expression).
      </p>
      <CodeBlock code={`import { Table, formulas, spreadsheet } from '@unify/table-react';

<Table
  db={db}
  table="trades"
  plugins={[
    ...spreadsheet(),
    formulas({
      columns: [
        { name: 'margin', expression: 'ROUND(pnl / NULLIF(notional, 0) * 100, 2)', label: 'Margin %', editable: true },
        { name: 'trade_year', expression: "DATE_PART('year', trade_date)::INTEGER", label: 'Year' },  // read-only (default)
      ],
    }),
  ]}
/>`} language="tsx" />

      <Heading level={2} id="column-options">Column Options</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Each <code>FormulaColumnDef</code> supports:
      </p>
      <CodeBlock code={`interface FormulaColumnDef {
  name: string;         // Output column name (used as field)
  expression: string;   // DuckDB SQL expression
  label?: string;       // Display label (defaults to name)
  width?: number;       // Column width in px (default: 150)
  align?: 'left' | 'center' | 'right';
  format?: string;      // Number format (e.g. 'number', 'currency', 'percent')
  editable?: boolean;   // Allow users to edit the expression at runtime (default: false)
}`} language="tsx" />

      <Heading level={2} id="editing-integration">Editing + Formulas</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        When combined with the editing plugin (or the <code>spreadsheet()</code> preset), formula columns are <strong>automatically recalculated</strong> when you edit any source column. The formula expressions run inside DuckDB's view, so edits to the overlay table are reflected immediately on commit.
      </p>

      <Heading level={2} id="editing-expressions">Editing Expressions</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Formula columns marked with <code>editable: true</code> allow users to modify the SQL expression at runtime. Double-click or press <strong>Enter</strong> / <strong>F2</strong> on an editable formula cell to open an inline editor showing the raw SQL expression. Non-editable formulas (the default) cannot be opened for editing.
      </p>
      <ul className="text-[13px] mb-3 list-disc pl-6 space-y-1" style={{ color: "var(--doc-text-secondary)" }}>
        <li><strong>Enter</strong> commits the new expression &mdash; the entire column recalculates instantly</li>
        <li><strong>Escape</strong> cancels without changes</li>
        <li><strong>Ctrl+Z</strong> / <strong>Ctrl+Y</strong> undo and redo expression changes (falls back to formula undo when there are no cell edits to undo)</li>
        <li>If the expression is invalid SQL, the change is rolled back and the editor stays open</li>
      </ul>
      <Callout type="info" title="Column-Level Edit">
        Editing a formula cell changes the expression for the <strong>entire column</strong>, not just one row. This is because formula expressions are DuckDB SQL that applies uniformly to all rows. Source columns (PnL, Volume, etc.) can still be edited per-cell as normal.
      </Callout>

      <Heading level={2} id="fill-handle">Fill Handle</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The <code>fillHandle()</code> plugin (included in the <code>spreadsheet()</code> preset) adds an Excel-like fill handle &mdash; a small blue square at the bottom-right of the active cell. Drag it to extend values with pattern detection:
      </p>
      <ul className="text-[13px] mb-6 list-disc pl-6 space-y-1" style={{ color: "var(--doc-text-secondary)" }}>
        <li><strong>Numbers</strong>: detects arithmetic progressions (1, 2, 3 &rarr; 4, 5, 6)</li>
        <li><strong>Dates</strong>: detects intervals and extrapolates</li>
        <li><strong>Text</strong>: copies or cycles through source values</li>
        <li><strong>Formula columns</strong>: skipped (they recalculate from source data)</li>
      </ul>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        You can also use keyboard shortcuts: <strong>Ctrl+D</strong> (Fill Down) and <strong>Ctrl+R</strong> (Fill Right) when a range is selected. Double-click the handle to auto-fill down to the extent of the adjacent column.
      </p>

      <Heading level={2} id="expressions">Expressions</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Any valid DuckDB SQL expression works &mdash; built-in functions, <code>CASE</code> statements, arithmetic, type casts, and string functions.
      </p>
      <CodeBlock code={`// Arithmetic
{ name: 'total', expression: 'price * quantity' }

// Conditional logic
{ name: 'status', expression: "CASE WHEN pnl > 0 THEN 'Profit' ELSE 'Loss' END" }

// Date functions
{ name: 'quarter', expression: "DATE_PART('quarter', trade_date)::INTEGER" }

// String functions
{ name: 'ticker_lower', expression: 'LOWER(ticker)' }

// Null-safe division
{ name: 'ratio', expression: 'ROUND(a / NULLIF(b, 0), 4)' }`} language="tsx" />
      <Callout type="tip" title="DuckDB Functions">
        You have access to the full DuckDB function library &mdash; <code>DATE_PART</code>, <code>ROUND</code>, <code>NULLIF</code>, <code>CASE WHEN</code>, <code>COALESCE</code>, string functions, and more. Check the DuckDB documentation for available functions.
      </Callout>

      <PageNav />
    </div>
  );
}
