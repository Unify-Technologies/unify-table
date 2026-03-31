import { PageTitle } from "../components/PageTitle";
import { Heading } from "../components/Heading";
import { CodeBlock } from "../components/CodeBlock";
import { Example } from "../components/Example";
import { Callout } from "../components/Callout";
import { PageNav } from "../components/PageNav";

export default function SqlBuilder() {
  return (
    <div>
      <PageTitle>SQL Builder</PageTitle>
      <p className="text-[15px] mb-4" style={{ color: "var(--doc-text-secondary)" }}>
        Immutable, chainable SQL builder with four statement types.
      </p>
      <p className="text-[13px] mb-4" style={{ color: "var(--doc-text-secondary)" }}>
        The SQL builder is the foundation of Unify Table. It's an immutable, chainable API that generates safe, properly escaped SQL from TypeScript. Every sort, filter, and group-by operation in the table ultimately becomes a SQL query built by this layer.
      </p>
      <p className="text-[13px] mb-4" style={{ color: "var(--doc-text-secondary)" }}>
        Each method call returns a new builder instance, so you can safely branch queries without mutating shared state. This makes it easy to build base queries and extend them for different purposes.
      </p>
      <Callout type="info" title="Used internally by Table">
        You don't need to use the SQL builder to render a table — the <code>&lt;Table&gt;</code> component
        and its <a href="#/query-engine" style={{color: "var(--doc-accent)"}}>DataSource</a> use it internally
        to generate all queries. Reach for the builder directly when you need custom queries outside the
        table lifecycle, such as dashboards, reports, or data transformations.
      </Callout>

      <Heading level={2} id="why">Why a SQL Builder?</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Instead of reimplementing sort, filter, and aggregate logic in JavaScript, Unify Table delegates to DuckDB — a real analytical database. The SQL builder ensures every query is properly escaped and optimized. This means you get database-grade performance for operations like sorting millions of rows or computing aggregations, without writing raw SQL strings.
      </p>
      <p className="text-[13px] mb-6" style={{ color: "var(--doc-text-secondary)" }}>
        The builder API is designed to compose naturally. You can start with a base query, then layer on filters, sorting, and limits as needed. Because each call returns a new instance, you can keep a reference to a partially-built query and extend it in different directions.
      </p>

      <Example
        id="sql-builder"
        title="SQL Builder — Live Queries"
        description="Three queries built with select(), all targeting the same trades_sample table. Toggle between them to see the generated SQL and live results from DuckDB."
        height={460}
      />

      <Heading level={2} id="select">select()</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The most commonly used builder. Chain <code>.from()</code>, <code>.where()</code>, <code>.orderBy()</code>, <code>.limit()</code>, and <code>.offset()</code> to construct SELECT queries. You can also use <code>.groupBy()</code> and <code>.having()</code> for aggregations.
      </p>
      <CodeBlock code={`import { select, gt } from '@unify/table-core';

const sql = select('name', 'salary')
  .from('employees')
  .where(gt('salary', 80000))
  .orderBy('salary', 'desc')
  .limit(10)
  .sql();
// SELECT "name", "salary" FROM "employees"
//   WHERE "salary" > 80000 ORDER BY "salary" DESC LIMIT 10`} language="tsx" />
      <p className="text-[13px] mb-6" style={{ color: "var(--doc-text-secondary)" }}>
        Since the builder is immutable, you can create reusable base queries and extend them:
      </p>
      <CodeBlock code={`const base = select().from('employees').where(gt('salary', 80000));

// Branch into two different queries from the same base
const topEarners = base.orderBy('salary', 'desc').limit(5).sql();
const byName     = base.orderBy('name', 'asc').sql();`} language="tsx" />

      <Heading level={2} id="update">update()</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Build UPDATE statements with <code>.set()</code> and optional <code>.where()</code> clauses.
      </p>
      <CodeBlock code={`import { update, eq } from '@unify/table-core';

const sql = update('employees')
  .set('salary', 95000)
  .where(eq('name', 'Alice'))
  .sql();
// UPDATE "employees" SET "salary" = 95000 WHERE "name" = 'Alice'`} language="tsx" />

      <Heading level={2} id="insert">insertInto()</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Build INSERT statements. Pass a plain object with column-value pairs to <code>.values()</code>.
      </p>
      <CodeBlock code={`import { insertInto } from '@unify/table-core';

const sql = insertInto('employees')
  .values({ name: 'Zara', department: 'Engineering', salary: 110000 })
  .sql();`} language="tsx" />

      <Heading level={2} id="delete">deleteFrom()</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Build DELETE statements. Always add a <code>.where()</code> clause to avoid deleting all rows.
      </p>
      <CodeBlock code={`import { deleteFrom, eq } from '@unify/table-core';

const sql = deleteFrom('employees')
  .where(eq('department', 'Research'))
  .sql();`} language="tsx" />

      <Heading level={2} id="safety">Safety</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        All values and identifiers are automatically escaped by the builder. You never need to worry about SQL injection when using the builder API. Under the hood, three utilities handle escaping:
      </p>
      <Callout type="warning" title="SQL Injection Protection">
        <p><strong>quoteIdent(name)</strong> — wraps column and table names in double quotes, escaping internal double quotes. Prevents injection through identifiers.</p>
        <p><strong>escapeString(value)</strong> — wraps string values in single quotes, doubling internal single quotes. Handles special characters safely.</p>
        <p><strong>toSqlLiteral(value)</strong> — routes values to the correct escaping: NULL for null/undefined, numbers and booleans as-is, strings through escapeString, dates as ISO strings.</p>
      </Callout>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Never concatenate raw user input into SQL strings. Always use the builder API or the filter predicates, which handle escaping automatically.
      </p>

      <PageNav />
    </div>
  );
}
