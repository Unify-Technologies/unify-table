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
        description="Press Ctrl+F (or ⌘F on macOS) to open the find bar, or Ctrl+H (⌘H) for find and replace. Try searching for a ticker like 'AAPL' or a desk name."
        height={420}
      />

      <Heading level={2} id="usage">Usage</Heading>
      <CodeBlock code={`import { Table, findReplace, editing, keyboard, selection } from '@unify/table-react';

<Table
  db={db}
  table="trades"
  plugins={[findReplace(), editing(), keyboard(), selection("range")]}
/>`} language="tsx" />

      <Heading level={2} id="shortcuts">Keyboard Shortcuts</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        <code>Ctrl+F</code> / <code>⌘F</code> opens the find bar. <code>Ctrl+H</code> / <code>⌘H</code> opens find and replace.
        Press <code>Escape</code> to close the bar.
      </p>

      <Heading level={2} id="options">Search Options</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The find bar includes toggles for <strong>case-sensitive</strong> matching and <strong>regular expression</strong> mode.
        Use the column dropdown to limit the search to a specific text column, or leave it on "All columns" to search everywhere.
        The match count updates in real time as you type.
      </p>

      <Heading level={2} id="replace">Replacing</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Click the expand chevron or press <code>Ctrl+H</code> / <code>⌘H</code> to reveal the replace row.
        Type the replacement text and click <strong>Replace</strong> to update only the current match and advance
        to the next one, or <strong>Replace All</strong> to update every matching cell at once.
        The affected count is displayed before any replacement is committed, so you can
        review the scope of the change.
      </p>
      <Callout type="tip" title="Works with Editing">
        Find & replace pairs naturally with the <code>editing</code> plugin — find highlights matches across the table, and replace uses the editing pipeline to commit changes with undo/redo support.
      </Callout>

      <Heading level={2} id="api">Programmatic API</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Use the exported helper functions to search and replace from code:
      </p>
      <CodeBlock code={`import { findInTable, replaceInTable } from '@unify/table-react';

// Count matching rows (searches all text columns)
const count = await findInTable(ctx, 'AAPL');

// Search in a specific column, case-sensitive
const count2 = await findInTable(ctx, 'Trading', 'desk', false, true);

// Replace all occurrences in a column
const affected = await replaceInTable(ctx, 'AAPL', 'GOOG', 'ticker');`} language="tsx" />
      <PageNav />
    </div>
  );
}
