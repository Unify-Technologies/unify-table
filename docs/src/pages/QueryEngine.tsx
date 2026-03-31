import { PageTitle } from "../components/PageTitle";
import { Heading } from "../components/Heading";
import { CodeBlock } from "../components/CodeBlock";
import { Example } from "../components/Example";
import { Callout } from "../components/Callout";
import { PageNav } from "../components/PageNav";

export default function QueryEngine() {
  return (
    <div>
      <PageTitle>Query Engine</PageTitle>
      <p className="text-[15px] mb-4" style={{ color: "var(--doc-text-secondary)" }}>
        The low-level interface between your app and DuckDB.
      </p>
      <p className="text-[13px] mb-4" style={{ color: "var(--doc-text-secondary)" }}>
        The QueryEngine is the bridge between your app and DuckDB. It wraps a TableConnection with convenience methods for common operations — querying rows, counting records, getting distinct values, and exporting data to Parquet.
      </p>
      <p className="text-[13px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Most of the time, you won't use the QueryEngine directly — the <code>&lt;Table&gt;</code> component and its plugins manage queries internally. But when you need to run custom queries, build dashboards outside the table, or integrate with other parts of your app, the QueryEngine gives you direct access to the same DuckDB connection.
      </p>

      <Example
        id="query-engine"
        title="QueryEngine in Action"
        description="Four QueryEngine methods called against the same trades_sample table: columns(), count(), distinct(), and query(). All return typed results from DuckDB."
        height={460}
      />

      <Heading level={2} id="connection">TableConnection</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The minimal interface that the QueryEngine wraps. Any object that implements these three methods can serve as a connection — this makes it easy to mock in tests or adapt to different DuckDB-WASM setups.
      </p>
      <CodeBlock code={`interface TableConnection {
  run(query: string): Promise<void>;
  runAndRead(query: string): Promise<Record<string, unknown>[]>;
  runAndReadParquetBlob(query: string): Promise<Blob>;
}`} language="tsx" />

      <Heading level={2} id="setup">DuckDB-WASM Setup</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        A typical setup initializes DuckDB-WASM, loads your data, and passes the connection to the table. The connection object you pass just needs to satisfy the <code>TableConnection</code> interface above.
      </p>
      <CodeBlock code={`import * as duckdb from '@duckdb/duckdb-wasm';

// Initialize DuckDB-WASM
const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());
const worker = new Worker(bundle.mainWorker!);
const logger = new duckdb.ConsoleLogger();
const db = new duckdb.AsyncDuckDB(logger, worker);
await db.instantiate(bundle.mainModule);

// Create a connection that satisfies TableConnection
const conn = await db.connect();

// Load data, then pass conn to <Table db={conn} table="trades" />`} language="tsx" />
      <Callout type="tip" title="When to use QueryEngine directly">
        Use the <code>&lt;Table&gt;</code> component for standard table UIs — it manages the QueryEngine internally. Use the QueryEngine directly when you need to run ad-hoc queries, build custom visualizations, or fetch data outside the table lifecycle.
      </Callout>

      <Heading level={2} id="engine">QueryEngine</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The engine provides typed convenience methods so you don't need to write raw SQL for common operations. All methods return promises and use the underlying connection's <code>runAndRead</code>.
      </p>
      <CodeBlock code={`import { createQueryEngine } from '@unify/table-core';

const engine = createQueryEngine(db);
const cols = await engine.columns('employees');
const total = await engine.count('employees');
const depts = await engine.distinct('employees', 'department');
const rows = await engine.query('SELECT * FROM employees LIMIT 10');`} language="tsx" />

      <Heading level={2} id="datasource">DataSource</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The DataSource sits on top of the QueryEngine and manages reactive state — sort order, active filters, group-by columns, and pagination. When you change any of these, the DataSource automatically rebuilds and re-executes the SQL query. Multiple changes within the same microtask are batched into a single query.
      </p>
      <CodeBlock code={`import { createDataSource } from '@unify/table-core';

const ds = createDataSource(engine, 'employees');
ds.setFilters([gt('salary', 80000)]);
ds.setSort([{ field: 'salary', dir: 'desc' }]);
// Both mutations coalesce into one query via queueMicrotask`} language="tsx" />
      <Callout type="info" title="Microtask Batching">
        Multiple state changes within the same microtask are batched into a single SQL query. This means calling <code>setFilters()</code> and <code>setSort()</code> in the same synchronous block only triggers one re-query, not two.
      </Callout>
      <PageNav />
    </div>
  );
}
