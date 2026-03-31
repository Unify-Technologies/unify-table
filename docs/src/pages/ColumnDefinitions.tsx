import { PageTitle } from "../components/PageTitle";
import { Heading } from "../components/Heading";
import { Example } from "../components/Example";
import { PropTable } from "../components/PropTable";
import { CodeBlock } from "../components/CodeBlock";
import { Callout } from "../components/Callout";
import { PageNav } from "../components/PageNav";

export default function ColumnDefinitions() {
  return (
    <div>
      <PageTitle>Column Definitions</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Control how columns are displayed, formatted, and edited.
      </p>

      <p className="text-[13px] mb-6" style={{ color: "var(--doc-text-secondary)" }}>
        Column definitions let you customize how each column is displayed, formatted, and behaves.
        If you don't provide column definitions, the Table auto-generates them from DuckDB's
        schema — detecting types, choosing sensible defaults for alignment and width, and using
        the column name as the header label. Custom definitions let you override any of these defaults.
      </p>

      <Heading level={2} id="auto-columns">Auto-Detected Columns</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        When no <code>columns</code> prop is passed, the table queries DuckDB's schema and creates
        columns automatically. This is the simplest way to get started — the table inspects every
        column in the DuckDB table, infers types, and renders them with sensible defaults.
      </p>

      <Heading level={2} id="column-types">Column Types</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        DuckDB column types map to four rendering modes:
      </p>
      <ul className="text-[13px] mb-4 list-disc pl-5 space-y-2" style={{ color: "var(--doc-text-secondary)" }}>
        <li>
          <strong style={{ color: "var(--doc-text)" }}>string</strong> — renders as plain text,
          left-aligned by default. Includes VARCHAR, TEXT, and similar DuckDB types.
        </li>
        <li>
          <strong style={{ color: "var(--doc-text)" }}>number</strong> — renders right-aligned by
          default. Includes INTEGER, BIGINT, DOUBLE, DECIMAL, and other numeric types. Supports
          format strings like <code>currency</code> and <code>compact</code>.
        </li>
        <li>
          <strong style={{ color: "var(--doc-text)" }}>date</strong> — renders as a formatted date
          string. Includes DATE, TIMESTAMP, and TIMESTAMPTZ types.
        </li>
        <li>
          <strong style={{ color: "var(--doc-text)" }}>boolean</strong> — renders as a visual
          indicator. Maps from DuckDB's BOOLEAN type.
        </li>
      </ul>

      <Heading level={2} id="custom-columns">Custom Columns</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Pass an array of column definitions to control labels, widths, alignment, and formatting:
      </p>
      <CodeBlock code={`<Table
  db={db}
  table="employees"
  columns={[
    { field: 'name', label: 'Full Name', width: 200 },
    { field: 'department', label: 'Dept', width: 120 },
    { field: 'salary', label: 'Salary', align: 'right', format: 'currency' },
    { field: 'hire_date', label: 'Hired', format: 'date' },
  ]}
/>`} language="tsx" />

      <Heading level={2} id="editing-columns">Editable Columns</Heading>
      <Example id="with-editing" title="Inline Editing with Validation" description="Double-click to edit. Ticker and Desk use select dropdowns. PnL validates input. Tab between cells." height={350} />

      <Heading level={2} id="column-def-props">ColumnDef Props</Heading>
      <PropTable
        title="ColumnDef"
        rows={[
          { name: "field", type: "string", description: "Column field name (matches DuckDB column)", required: true },
          { name: "label", type: "string", description: "Display header label" },
          { name: "width", type: "number", description: "Initial column width in pixels" },
          { name: "minWidth", type: "number", description: "Minimum resize width" },
          { name: "maxWidth", type: "number", description: "Maximum resize width" },
          { name: "align", type: "'left' | 'right' | 'center'", default: "'left'", description: "Cell text alignment" },
          { name: "pin", type: "'left' | 'right'", description: "Pin column to left or right edge" },
          { name: "hidden", type: "boolean", default: "false", description: "Hide column from view" },
          { name: "sortable", type: "boolean", default: "true", description: "Allow sorting by this column" },
          { name: "filterable", type: "boolean", default: "true", description: "Show filter input for this column" },
          { name: "editable", type: "boolean", default: "true", description: "Allow inline editing" },
          { name: "render", type: "(value, row) => ReactNode", description: "Custom cell render function" },
          { name: "format", type: "string", description: "Format string (currency, date, compact, etc.)" },
          { name: "editor", type: "'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox'", description: "Editor type for inline editing" },
          { name: "editorOptions", type: "string[]", description: "Options for select editor" },
          { name: "validate", type: "(value) => true | string", description: "Validation function, returns error string on failure" },
        ]}
      />

      <Heading level={2} id="formatting-note">Formatting: format vs formatting Plugin</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        There are two ways to format cell values, and they serve different purposes:
      </p>
      <ul className="text-[13px] mb-4 list-disc pl-5 space-y-2" style={{ color: "var(--doc-text-secondary)" }}>
        <li>
          <strong style={{ color: "var(--doc-text)" }}>The <code>format</code> prop</strong> on a column
          definition controls how values are displayed as text — currency symbols, date formatting,
          compact notation. It is static and applies to every cell in the column.
        </li>
        <li>
          <strong style={{ color: "var(--doc-text)" }}>The <code>formatting</code> plugin</strong> applies
          conditional visual styles — background color, text color, bold — based on cell values.
          Use it for things like highlighting negative numbers in red or applying threshold-based
          color scales.
        </li>
      </ul>
      <Callout type="tip" title="Rule of thumb">
        Use <code>format</code> to control what text is shown. Use the <code>formatting</code> plugin
        to control how that text looks based on its value.
      </Callout>

      <PageNav />
    </div>
  );
}
