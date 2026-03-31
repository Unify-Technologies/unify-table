import { PageTitle } from "../components/PageTitle";
import { Heading } from "../components/Heading";
import { CodeBlock } from "../components/CodeBlock";
import { Example } from "../components/Example";
import { Callout } from "../components/Callout";
import { PageNav } from "../components/PageNav";

export default function FilterSystem() {
  return (
    <div>
      <PageTitle>Filter System</PageTitle>
      <p className="text-[15px] mb-4" style={{ color: "var(--doc-text-secondary)" }}>
        Composable SQL filter predicates with type-safe builders.
      </p>
      <p className="text-[13px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        The filter system provides a composable, type-safe API for building SQL WHERE clauses. Filters are plain objects that compose with <code>and()</code>, <code>or()</code>, and <code>not()</code>. Every value is automatically escaped to prevent SQL injection.
      </p>

      <Example
        id="filter-system"
        title="Filter Predicates in Action"
        description={<>Pre-filtered to AAPL and MSFT trades with PnL above 500. Try editing the filter inputs — use syntax like <code>&gt; 1000</code>, <code>50..500</code>, or <code>GOOG,AMZN</code>.</>}
        height={420}
      />

      <Heading level={2} id="predicates">Filter Predicates</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Each predicate targets a single column and produces a SQL condition. String predicates like <code>contains</code>, <code>startsWith</code>, and <code>endsWith</code> use case-insensitive ILIKE matching with properly escaped wildcards.
      </p>
      <CodeBlock code={`import { eq, neq, gt, gte, lt, lte, contains, startsWith,
         endsWith, oneOf, between, isNull, isNotNull } from '@unify/table-core';

eq('status', 'Active')          // "status" = 'Active'
gt('salary', 80000)             // "salary" > 80000
contains('name', 'ali')         // "name" ILIKE '%ali%'
oneOf('dept', ['Sales','Eng'])  // "dept" IN ('Sales','Eng')
between('price', 10, 100)       // "price" BETWEEN 10 AND 100
isNull('email')                 // "email" IS NULL`} language="tsx" />

      <Heading level={2} id="combinators">Composition</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Combinators let you build arbitrarily complex filter trees. <code>and()</code> requires all conditions to match, <code>or()</code> requires at least one, and <code>not()</code> inverts a condition. They nest freely, so you can express any boolean logic.
      </p>
      <CodeBlock code={`import { and, or, not } from '@unify/table-core';

const filter = and(
  or(contains('category', 'Laptop'), contains('category', 'Monitor')),
  between('price', 200, 2000),
  not(eq('status', 'Discontinued'))
);`} language="tsx" />
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Since filters are plain objects, you can build them dynamically based on user input:
      </p>
      <CodeBlock code={`// Build filters conditionally
const conditions = [];
if (minPrice) conditions.push(gte('price', minPrice));
if (maxPrice) conditions.push(lte('price', maxPrice));
if (category) conditions.push(eq('category', category));

const filter = conditions.length > 0 ? and(...conditions) : undefined;`} language="tsx" />
      <Callout type="tip" title="Filters as Data">
        Because filters are plain objects (not class instances), they serialize cleanly to JSON. This makes it easy to persist filter state, share it across tabs, or include it in saved views.
      </Callout>

      <Heading level={2} id="parser">Free-Form Parser</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The free-form parser converts human-readable expressions into filter predicates. It supports comparison operators, comma-separated lists (becomes IN), range syntax with <code>..</code> (becomes BETWEEN), and date-aware parsing.
      </p>
      <CodeBlock code={`import { parseFilterExpr } from '@unify/table-core';

parseFilterExpr('amount', '>= 100')        // "amount" >= 100
parseFilterExpr('category', 'A,B,C')       // IN ('A','B','C')
parseFilterExpr('price', '50..500')         // BETWEEN 50 AND 500
parseFilterExpr('date', '2024-01', 'date')  // date range for month`} language="tsx" />
      <PageNav />
    </div>
  );
}
