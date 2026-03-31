import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { Example } from "../../components/Example";
import { CodeBlock } from "../../components/CodeBlock";
import { Callout } from "../../components/Callout";
import { PageNav } from "../../components/PageNav";

export default function FiltersPlugin() {
  return (
    <div>
      <PageTitle>Filters</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Adds a filter input row below headers for column-level filtering.
      </p>

      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Filters let users narrow down visible rows using composable SQL predicates. Under the hood,
        each filter becomes a WHERE clause — DuckDB handles the actual filtering, not JavaScript.
        This means filtering scales to millions of rows with no performance cliff, and the syntax
        you type in the filter input maps directly to efficient SQL operations.
      </p>

      <Callout type="info">See filters in action in the <a href="#/demo" style={{color: "var(--doc-accent)"}}>Interactive Demo</a> — try filtering the trades table by ticker, region, or desk.</Callout>

      <Heading level={2} id="usage">Usage</Heading>
      <CodeBlock code={`import { Table, filters } from '@unify/table-react';

<Table db={db} table="products" plugins={[filters()]} />`} language="tsx" />

      <Heading level={2} id="example">Example</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Same <code>trades_sample</code> table as the <a href="#/table-basics" style={{color: "var(--doc-accent)"}}>basic example</a>,
        now with <code>filters()</code> added. Notice the filter row below the headers.
      </p>
      <Example id="with-filters" description="Pre-filtered to profitable AAPL trades. Try typing GOOG,META in the ticker filter, or > 500 in notional." height={350} />

      <Heading level={2} id="filter-syntax">Filter Syntax</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Type directly in filter inputs. Supported patterns: <code>&gt; 100</code>, <code>50..500</code> (range), <code>A,B,C</code> (one of), <code>!value</code> (not equal), <code>*pattern*</code> (contains).
      </p>

      <Heading level={2} id="built-in-predicates">Built-in Predicates</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        When building filters programmatically, the core library provides composable predicate functions
        that generate safe, parameterized SQL. These can be combined with <code>and()</code>, <code>or()</code>,
        and <code>not()</code> combinators.
      </p>
      <CodeBlock code={`import { eq, neq, gt, gte, lt, lte, contains, startsWith,
         endsWith, oneOf, between, isNull, isNotNull,
         and, or, not, raw } from '@unify/table-core';

// Comparison
eq('status', 'active')        // status = 'active'
neq('status', 'archived')     // status != 'archived'
gt('price', 100)              // price > 100
gte('price', 100)             // price >= 100
lt('quantity', 10)            // quantity < 10
lte('quantity', 10)           // quantity <= 10

// Pattern matching
contains('name', 'corp')     // name ILIKE '%corp%'
startsWith('name', 'A')      // name ILIKE 'A%'
endsWith('email', '.com')    // email ILIKE '%.com'

// Set & range
oneOf('region', ['US', 'EU']) // region IN ('US', 'EU')
between('price', 10, 100)    // price BETWEEN 10 AND 100

// Null checks
isNull('notes')              // notes IS NULL
isNotNull('notes')           // notes IS NOT NULL

// Combinators
and(gt('price', 50), lt('price', 200))
or(eq('status', 'active'), eq('status', 'pending'))
not(isNull('email'))`} language="tsx" />

      <Heading level={2} id="programmatic">Programmatic Filtering</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Set filters from code via the DataSource's <code>setFilters()</code> method, which
        accepts an array of filter predicates. This is useful for building custom filter UIs
        or applying filters based on external events.
      </p>
      <CodeBlock code={`import { gt, between, eq, and } from '@unify/table-core';

// Set filters as an array of predicates
ctx.datasource.setFilters([
  gt('price', 100),
  eq('status', 'active'),
]);

// Combine multiple conditions on the same column
ctx.datasource.setFilters([
  between('price', 50, 500),
  eq('status', 'active'),
]);

// Clear all filters by passing an empty array
ctx.datasource.setFilters([]);`} language="tsx" />
      <Callout type="tip" title="Debounced by default">
        Filter inputs in the UI are debounced to avoid firing a query on every keystroke.
        Programmatic filters applied via <code>setFilter()</code> take effect on the next
        microtask batch.
      </Callout>
      <PageNav />
    </div>
  );
}
