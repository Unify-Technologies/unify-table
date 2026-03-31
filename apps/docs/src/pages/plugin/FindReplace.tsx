import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { CodeBlock } from "../../components/CodeBlock";
import { Example } from "../../components/Example";
import { Callout } from "../../components/Callout";
import { PageNav } from "../../components/PageNav";

export default function FindReplacePlugin() {
  return (
    <div>
      <PageTitle>Find & Replace</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Search across the entire table and optionally replace matches. Shows affected row count before committing.
      </p>

      <Example
        id="with-find-replace"
        title="Find & Replace"
        description="Press Ctrl+F to open the find bar, or Ctrl+H for find and replace. Try searching for a ticker like 'AAPL' or a desk name."
        height={420}
      />

      <Heading level={2} id="usage">Usage</Heading>
      <CodeBlock code={`import { Table, findReplace, editing, keyboard, selection } from '@unify/table-react';

<Table
  db={db}
  table="trades"
  plugins={[findReplace(), editing(), keyboard(), selection("range")]}
/>`} language="tsx" />

      <Heading level={2} id="api">Programmatic API</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Use the exported helper functions to search and replace from code:
      </p>
      <CodeBlock code={`import { findInTable, replaceInTable } from '@unify/table-react';

// Count matching rows (searches all text columns)
const count = await findInTable(ctx, 'AAPL');

// Search in a specific column
const count2 = await findInTable(ctx, 'Trading', 'desk');

// Replace all occurrences in a column
const affected = await replaceInTable(ctx, 'AAPL', 'GOOG', 'ticker');`} language="tsx" />

      <Heading level={2} id="shortcuts">Keyboard Shortcuts</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        <code>Ctrl+F</code> opens the find bar. <code>Ctrl+H</code> opens find and replace.
        The affected count is displayed before any replacement is committed, so you can
        review the scope of the change.
      </p>
      <Callout type="tip" title="Works with Editing">
        Find & replace pairs naturally with the <code>editing</code> plugin — find highlights matches across the table, and replace uses the editing pipeline to commit changes with validation.
      </Callout>
      <PageNav />
    </div>
  );
}
