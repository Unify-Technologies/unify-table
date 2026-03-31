import { PageTitle } from "../../components/PageTitle";
import { Heading } from "../../components/Heading";
import { Example } from "../../components/Example";
import { CodeBlock } from "../../components/CodeBlock";
import { Callout } from "../../components/Callout";
import { PageNav } from "../../components/PageNav";

export default function ClipboardPlugin() {
  return (
    <div>
      <PageTitle>Clipboard</PageTitle>
      <p className="text-[15px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        Copy and paste cells in TSV format. Supports pasting from spreadsheets and paste-as-append.
      </p>

      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The clipboard plugin enables <code>Ctrl+C</code> / <code>Ctrl+V</code> for table cells, using tab-separated values (TSV)
        as the interchange format. This means you can copy cells from Unify Table and paste them directly into Excel,
        Google Sheets, or any spreadsheet — and vice versa. When pasting data that exceeds the current selection,
        new rows are appended to the table automatically.
      </p>

      <Callout type="tip" title="Works best with Selection + Keyboard">
        Clipboard reads from the current selection. Pair it with{" "}
        <a href="#/plugins/selection" style={{color: "var(--doc-accent)"}}>selection('multi')</a> or{" "}
        <a href="#/plugins/selection" style={{color: "var(--doc-accent)"}}>selection('range')</a> for rectangular copy/paste, and{" "}
        <a href="#/plugins/keyboard" style={{color: "var(--doc-accent)"}}>keyboard()</a> for Ctrl+C/V shortcut handling.
      </Callout>

      <Heading level={2} id="usage">Usage</Heading>
      <CodeBlock code={`import { Table, clipboard, selection, keyboard } from '@unify/table-react';

// Full spreadsheet-like copy/paste experience
<Table
  db={db}
  table="data"
  plugins={[selection('range'), keyboard(), clipboard()]}
/>`} language="tsx" />

      <Heading level={2} id="example">Example</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Select cells below, then press <code>Ctrl+C</code> to copy. Open a spreadsheet and press <code>Ctrl+V</code> — the data
        transfers as tab-separated values.
      </p>
      <Example id="with-clipboard" description="Select a range with Shift+Click, then Ctrl+C to copy. Click elsewhere and Ctrl+V to paste. Works with external spreadsheets too." height={350} />

      <Heading level={2} id="operations">Operations</Heading>
      <div className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        <ul className="list-disc pl-5 space-y-1">
          <li><code>Ctrl+C</code> — copies selected cells as tab-separated values (TSV), compatible with Excel and Google Sheets</li>
          <li><code>Ctrl+V</code> — pastes TSV data into the selected region, matching columns by position</li>
          <li><strong>Paste-as-append</strong> — when pasted data has more rows than the selection, excess rows are appended to the table via <code>INSERT INTO</code></li>
        </ul>
      </div>

      <Callout type="warning" title="Secure context required">
        The Clipboard API requires HTTPS or localhost. Copy/paste will silently fail on plain HTTP connections.
      </Callout>
      <PageNav />
    </div>
  );
}
