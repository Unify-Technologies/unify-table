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
        Non-destructive inline cell editing. The source table is never modified — edits live in
        a separate overlay and are merged on the fly via a DuckDB view.
      </p>

      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The editing plugin turns your table into a spreadsheet. Double-click a cell, press Enter,
        or start typing to enter edit mode. Changes follow commit/cancel semantics — press Enter
        or Tab to confirm, Escape to discard.
      </p>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Under the hood, editing is <strong>non-destructive</strong>. The source table remains
        immutable — it can be shared by other views, queries, or users without interference.
        Each editable table instance gets its own overlay table in DuckDB that stores only the
        modified rows. A merge view combines the source with the overlay, and all downstream
        features (filters, sort, grouping) operate on this merged result transparently.
      </p>

      <Heading level={2} id="how-it-works">How It Works</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        When the editing plugin is active, three DuckDB objects are created behind the scenes:
      </p>
      <div className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Source table</strong> — your original data, never modified by edits</li>
          <li><strong>Overlay table</strong> — stores only changed, added, or deleted rows</li>
          <li><strong>Merge view</strong> — a DuckDB VIEW that unions the source with the overlay, excluding deleted rows and preferring overlay versions of edited rows</li>
        </ul>
      </div>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The existing ViewManager (which handles filters and sort) sits on top of the merge view.
        This means filtering, sorting, and grouping all work unchanged — they simply operate on
        the merged result instead of the raw table.
      </p>
      <Heading level={2} id="usage">Usage</Heading>
      <CodeBlock code={`import { Table, editing, keyboard, selection } from '@unify/table-react';

// Basic editing — source table is never modified
<Table db={db} table="employees" plugins={[editing(), keyboard(), selection('range')]} />`} language="tsx" />
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Tables are read-only by default. Adding the <code>editing()</code> plugin enables
        non-destructive editing. Pair it with <code>keyboard()</code> for Enter/Tab/Escape
        controls and <code>selection('range')</code> for spreadsheet-like cell selection.
      </p>

      <Heading level={2} id="options">Options</Heading>
      <CodeBlock code={`editing({
  enabled: true,    // initial editing state (default: true)
  undoDepth: 50,    // max undo stack depth (default: 50)
})`} language="tsx" />
      <div className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        <ul className="list-disc pl-5 space-y-1">
          <li><code>enabled</code> — whether editing is active on mount. Can be toggled at runtime via the <code>editing:toggle</code> event.</li>
          <li><code>undoDepth</code> — how many operations to keep in the undo stack. Oldest operations are dropped when the limit is exceeded.</li>
        </ul>
      </div>

      <Heading level={2} id="example">Example</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Trade data with <code>editing()</code>, <code>keyboard()</code>, and <code>selection('range')</code>.
        Column definitions specify the editor type and validation rules for each field.
      </p>
      <Example id="with-editing" description="Double-click any cell to edit. Ticker and Desk use select dropdowns. PnL validates numeric input. Tab moves between cells." height={350} />

      <Heading level={2} id="controls">Controls</Heading>
      <div className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Double-click</strong> or <strong>Enter</strong> — start editing the active cell</li>
          <li><strong>F2</strong> — start editing without clearing the current value</li>
          <li><strong>Start typing</strong> — replace the cell value and enter edit mode</li>
          <li><strong>Enter</strong> — confirm the edit and move down</li>
          <li><strong>Tab</strong> — confirm the edit and move right</li>
          <li><strong>Escape</strong> — cancel the edit, revert to the previous value</li>
          <li><strong>Delete</strong> — clear the cell contents</li>
          <li><strong>Ctrl+Z</strong> / <strong>⌘Z</strong> — undo the last edit</li>
          <li><strong>Ctrl+Y</strong> / <strong>Ctrl+Shift+Z</strong> / <strong>⌘⇧Z</strong> — redo</li>
        </ul>
      </div>

      <Heading level={2} id="validation">Validation</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Column definitions can include a <code>validate</code> function that receives the new
        value and returns <code>true</code> or an error message string. Invalid edits are
        rejected and the cell reverts to its previous value.
      </p>
      <CodeBlock code={`const columns = [
  {
    field: 'price',
    editor: 'number',
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

      <Heading level={2} id="select-editor">Select Editor</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Set <code>editor: 'select'</code> with <code>editorOptions</code> to restrict a cell to a fixed list of values.
        Add <code>editorFreeform: true</code> to also allow arbitrary values — the input becomes a combobox where
        the user can pick from the list or type a new value.
      </p>
      <CodeBlock code={`const columns = [
  // Strict: only the listed values are allowed
  { field: 'status', editor: 'select', editorOptions: ['Open', 'Closed', 'Pending'] },

  // Freeform: suggestions from the list, but any value accepted
  { field: 'category', editor: 'select', editorOptions: ['Bug', 'Feature', 'Chore'], editorFreeform: true },
];`} language="tsx" />

      <Heading level={2} id="save-discard">Save & Discard</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Edits accumulate in the overlay without touching the source table. You control when
        (and whether) they are applied:
      </p>
      <CodeBlock code={`// Save: flush all overlay edits into the source table
ctx.emit('editing:save');

// Discard: clear all pending edits, revert to original data
ctx.emit('editing:discard');

// Toggle: enable/disable editing mode (edits are preserved)
ctx.emit('editing:toggle');`} language="tsx" />
      <div className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        <ul className="list-disc pl-5 space-y-1">
          <li><code>editing:save</code> — applies all pending edits, inserts, and deletes to the source table, then clears the overlay. This is the <strong>only</strong> moment the source table is modified.</li>
          <li><code>editing:discard</code> — drops all pending changes and resets to the original data.</li>
          <li><code>editing:toggle</code> — toggles editing mode on/off. When disabled, cells cannot be edited but pending changes remain visible. Toggle back on to resume editing.</li>
        </ul>
      </div>
      <Callout type="warning" title="Save is explicit">
        The source table is never modified automatically. You must emit <code>editing:save</code> to
        persist changes. This makes it safe to use the editing plugin on shared tables — other
        consumers see the original data until you explicitly save.
      </Callout>

      <Heading level={2} id="undo-redo">Undo & Redo</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Every edit, row addition, and row deletion is tracked in an operation log. <code>Ctrl+Z</code> (<code>⌘Z</code> on macOS) undoes
        the last operation, <code>Ctrl+Y</code> or <code>Ctrl+Shift+Z</code> (<code>⌘⇧Z</code> on macOS) redoes it. The undo stack supports all operation types — cell
        edits, row additions, and row deletions — and correctly restores the previous state including
        reverting overlay rows back to the source when all edits to a row are undone.
      </p>

      <Heading level={2} id="row-operations">Row Operations</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        All edits go through the overlay. The source table is never modified until you explicitly save.
      </p>

      <Heading level={2} id="architecture">Architecture</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The editing plugin uses the <code>EditOverlay</code> from <code>@unify/table-core</code> and
        publishes an <code>EditingState</code> to <code>ctx.editing</code>. When the plugin is not registered,
        <code>ctx.editing</code> is <code>null</code> and no editing is possible. All edit operations — including
        those triggered by clipboard paste or find-and-replace — automatically route through the overlay.
      </p>
      <CodeBlock code={`// The overlay is lazy — created on first edit, not on mount
// Access the core EditOverlay via @unify/table-core if building custom integrations
import { createEditOverlay } from '@unify/table-core';
import type { EditOverlay, DirtyRow } from '@unify/table-core';`} language="tsx" />
      <PageNav />
    </div>
  );
}
