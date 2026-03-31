import { PageTitle } from "../components/PageTitle";
import { Heading } from "../components/Heading";
import { CodeBlock } from "../components/CodeBlock";
import { Callout } from "../components/Callout";
import { PageNav } from "../components/PageNav";

const BASE = window.location.origin + "/unify-table";

export default function LlmDocs() {
  return (
    <div>
      <PageTitle>LLM-Ready Docs</PageTitle>
      <p className="text-[15px] mb-4" style={{ color: "var(--doc-text-secondary)" }}>
        Machine-readable documentation for AI assistants and code generators.
      </p>
      <p className="text-[13px] mb-4" style={{ color: "var(--doc-text-secondary)" }}>
        The interactive docs you're reading right now are great for humans — code examples,
        live demos, visual themes. But LLMs can't run JavaScript or browse an SPA. They need
        the same information as plain text they can ingest in a single request.
      </p>
      <p className="text-[13px] mb-8" style={{ color: "var(--doc-text-secondary)" }}>
        We publish two static files following the <a href="https://llmstxt.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--doc-accent)" }}>llmstxt.org</a> convention,
        generated at build time from the same page sources that power this site. They stay
        in sync automatically — no separate docs to maintain.
      </p>

      <Heading level={2} id="files">The Two Files</Heading>

      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        <strong style={{ color: "var(--doc-text)" }}>llms.txt</strong> is a curated index — one
        line per page with a short description. Use it when you need the LLM to understand
        what's available and navigate to the right section. It's small enough to fit in any
        context window.
      </p>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        <strong style={{ color: "var(--doc-text)" }}>llms-full.txt</strong> is the complete
        documentation — every page extracted into a single markdown file (~80 KB). Use it when
        you want the LLM to have deep knowledge of the entire API: plugin options, filter
        predicates, display configuration, SQL builder chains, and more.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <a
          href={`${BASE}/llms.txt`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg p-4 no-underline transition-colors"
          style={{ border: "1px solid var(--doc-border)", backgroundColor: "var(--doc-surface-alt)" }}
        >
          <div className="text-sm font-semibold mb-1" style={{ color: "var(--doc-text)" }}>llms.txt</div>
          <div className="text-[12px]" style={{ color: "var(--doc-text-muted)" }}>~6 KB &middot; Index with links and descriptions</div>
        </a>
        <a
          href={`${BASE}/llms-full.txt`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg p-4 no-underline transition-colors"
          style={{ border: "1px solid var(--doc-border)", backgroundColor: "var(--doc-surface-alt)" }}
        >
          <div className="text-sm font-semibold mb-1" style={{ color: "var(--doc-text)" }}>llms-full.txt</div>
          <div className="text-[12px]" style={{ color: "var(--doc-text-muted)" }}>~80 KB &middot; Complete documentation in one file</div>
        </a>
      </div>

      <Heading level={2} id="when-to-use">When to Use Which</Heading>
      <div className="text-[13px] mb-6 space-y-1" style={{ color: "var(--doc-text-secondary)" }}>
        <p><strong style={{ color: "var(--doc-text)" }}>Quick reference</strong> — feed <code>llms.txt</code> to your AI assistant when you need it to understand the library structure and find the right feature. The index is compact enough for small context windows or system prompts.</p>
        <p><strong style={{ color: "var(--doc-text)" }}>Deep integration</strong> — feed <code>llms-full.txt</code> when you want the LLM to write code that uses the library correctly — choosing the right plugins, composing filters, configuring displays, or building SQL queries. The full doc gives it everything it needs.</p>
        <p><strong style={{ color: "var(--doc-text)" }}>Project rules</strong> — add the URL to your editor's AI context file (e.g. <code>CLAUDE.md</code>, <code>.cursorrules</code>, <code>copilot-instructions.md</code>) so your assistant always has up-to-date Unify Table knowledge.</p>
      </div>

      <Heading level={2} id="usage">Usage Examples</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        Point your AI assistant to the URL directly. Most tools can fetch and read plain text.
      </p>
      <CodeBlock code={`# Claude Code — fetch into context
fetch ${BASE}/llms-full.txt

# Or add to your project's CLAUDE.md
Unify Table docs: ${BASE}/llms-full.txt`} language="bash" />

      <Callout type="tip" title="Always up to date">
        Both files are regenerated on every build and deployed alongside this site.
        Link to the URL rather than copying the content — that way your AI assistant
        always sees the latest version.
      </Callout>

      <Heading level={2} id="how-its-built">How It's Built</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        A Node script reads every documentation page's TSX source, extracts headings,
        paragraphs, code blocks, and callouts via pattern matching, and assembles them
        into clean markdown. The script runs as part of the Vite build pipeline — <code>llms.txt</code> and <code>llms-full.txt</code> are
        placed in the <code>public/</code> directory and served as static files.
      </p>
      <CodeBlock code={`# Generate manually
node docs/scripts/generate-llms.mjs

# Or as part of the build (runs automatically)
pnpm --filter docs build`} language="bash" />

      <Heading level={2} id="spec">The llms.txt Standard</Heading>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The <a href="https://llmstxt.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--doc-accent)" }}>llmstxt.org</a> specification
        defines a simple convention: place a markdown file at <code>/llms.txt</code> with
        an H1 title, an optional blockquote summary, and H2 sections containing links with
        descriptions. An <code>## Optional</code> section marks resources that can be skipped
        when context is limited.
      </p>
      <p className="text-[13px] mb-3" style={{ color: "var(--doc-text-secondary)" }}>
        The companion <code>llms-full.txt</code> expands all linked content into a single
        file — useful when the LLM needs comprehensive knowledge rather than a table of contents.
      </p>
      <PageNav />
    </div>
  );
}
