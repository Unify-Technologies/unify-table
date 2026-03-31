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
        Add computed columns that evaluate SQL expressions on each row.
      </p>

      <Example
        id="with-formulas"
        title="Formula Columns"
        description={<>Two computed columns added: <strong>PnL/Unit</strong> (pnl divided by volume) and <strong>Year</strong> (extracted from trade_date). Formulas run as DuckDB expressions in the SELECT clause.</>}
        height={420}
      />

      <Heading level={2} id="usage">Usage</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Register formula columns before mounting, then include the <code>formulas()</code> plugin.
      </p>
      <CodeBlock code={`import { Table, formulas, addFormulaColumn, removeFormulaColumn } from '@unify/table-react';

// Register computed columns
addFormulaColumn('pnl_per_unit', 'ROUND(pnl / NULLIF(volume, 0), 4)');
addFormulaColumn('trade_year', "DATE_PART('year', trade_date)::INTEGER");

<Table db={db} table="trades" plugins={[formulas()]} />`} language="tsx" />

      <Heading level={2} id="api">Programmatic API</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Add or remove formula columns dynamically. Use <code>formulaViewSql()</code> to get the underlying SQL with all computed columns included.
      </p>
      <CodeBlock code={`import { addFormulaColumn, removeFormulaColumn, formulaViewSql } from '@unify/table-react';

addFormulaColumn('margin', 'ROUND(pnl / NULLIF(notional, 0) * 100, 2)');

// Get the generated view SQL
formulaViewSql('trades');
// → SELECT *, (ROUND(pnl / NULLIF(notional, 0) * 100, 2)) AS "margin" FROM "trades"

removeFormulaColumn('margin');`} language="tsx" />

      <Heading level={2} id="expressions">Expressions</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Any valid DuckDB SQL expression works — built-in functions, CASE statements, arithmetic,
        and type casts. Expressions are injected into the SELECT clause as computed columns.
      </p>
      <Callout type="tip" title="DuckDB Functions">
        You have access to the full DuckDB function library — <code>DATE_PART</code>, <code>ROUND</code>, <code>NULLIF</code>, <code>CASE WHEN</code>, string functions, and more. Check the DuckDB documentation for available functions.
      </Callout>
      <PageNav />
    </div>
  );
}
