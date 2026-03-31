#!/usr/bin/env node

/**
 * Generates llms.txt and llms-full.txt from the doc page TSX files.
 *
 * llms.txt  — curated index with links to each section (per llmstxt.org spec)
 * llms-full.txt — full documentation content in a single markdown file
 *
 * Run:  node apps/docs/scripts/generate-llms.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = resolve(__dirname, "../src/pages");
const OUT_DIR = resolve(__dirname, "../public");
const BASE_URL = "https://unify.sh/unify-table";

// ── Route → file mapping (matches App.tsx), grouped by nav section ──────────

const SECTIONS = [
  {
    title: "Overview",
    pages: [
      { route: "/getting-started", file: "GettingStarted.tsx", label: "Getting Started" },
      { route: "/how-it-works", file: "HowItWorks.tsx", label: "How It Works" },
    ],
  },
  {
    title: "Core Concepts",
    pages: [
      { route: "/table-basics", file: "TableBasics.tsx", label: "Table Basics" },
      { route: "/column-definitions", file: "ColumnDefinitions.tsx", label: "Column Definitions" },
      { route: "/themes", file: "Themes.tsx", label: "Themes" },
      { route: "/density-layout", file: "DensityLayout.tsx", label: "Density & Layout" },
    ],
  },
  {
    title: "Plugins",
    pages: [
      { route: "/plugins", file: "PluginOverview.tsx", label: "Plugin Overview" },
      { route: "/plugins/filters", file: "plugin/Filters.tsx", label: "Filters" },
      { route: "/plugins/selection", file: "plugin/Selection.tsx", label: "Selection" },
      { route: "/plugins/editing", file: "plugin/Editing.tsx", label: "Editing" },
      { route: "/plugins/keyboard", file: "plugin/Keyboard.tsx", label: "Keyboard" },
      { route: "/plugins/clipboard", file: "plugin/Clipboard.tsx", label: "Clipboard" },
      { route: "/plugins/column-resize", file: "plugin/ColumnResize.tsx", label: "Column Resize" },
      { route: "/plugins/column-pin", file: "plugin/ColumnPin.tsx", label: "Column Pin" },
      { route: "/plugins/column-reorder", file: "plugin/ColumnReorder.tsx", label: "Column Reorder" },
      { route: "/plugins/context-menu", file: "plugin/ContextMenu.tsx", label: "Context Menu" },
      { route: "/plugins/views", file: "plugin/Views.tsx", label: "Views" },
      { route: "/plugins/table-io", file: "plugin/TableIO.tsx", label: "Table I/O" },
      { route: "/plugins/find-replace", file: "plugin/FindReplace.tsx", label: "Find & Replace" },
      { route: "/plugins/formulas", file: "plugin/Formulas.tsx", label: "Formulas" },
      { route: "/plugins/row-grouping", file: "plugin/RowGrouping.tsx", label: "Row Grouping" },
      { route: "/plugins/formatting", file: "plugin/Formatting.tsx", label: "Formatting" },
      { route: "/plugins/status-bar", file: "plugin/StatusBar.tsx", label: "Status Bar" },
    ],
  },
  {
    title: "Presets & Panels",
    pages: [
      { route: "/presets", file: "Presets.tsx", label: "Presets" },
      { route: "/panels", file: "Panels.tsx", label: "Panels" },
    ],
  },
  {
    title: "Displays & Charts",
    pages: [
      { route: "/displays", file: "DisplayOverview.tsx", label: "Display Overview" },
      { route: "/displays/chart", file: "display/Chart.tsx", label: "Chart Display" },
      { route: "/displays/stats", file: "display/Stats.tsx", label: "Stats Display" },
      { route: "/displays/pivot", file: "display/Pivot.tsx", label: "Pivot Display" },
      { route: "/displays/summary", file: "display/Summary.tsx", label: "Summary Display" },
      { route: "/displays/correlation", file: "display/Correlation.tsx", label: "Correlation Display" },
      { route: "/displays/timeline", file: "display/Timeline.tsx", label: "Timeline Display" },
      { route: "/displays/outliers", file: "display/Outliers.tsx", label: "Outliers Display" },
      { route: "/charts", file: "Charts.tsx", label: "Charts" },
    ],
  },
  {
    title: "Data Layer",
    pages: [
      { route: "/sql-builder", file: "SqlBuilder.tsx", label: "SQL Builder" },
      { route: "/filter-system", file: "FilterSystem.tsx", label: "Filter System" },
      { route: "/query-engine", file: "QueryEngine.tsx", label: "Query Engine" },
      { route: "/headless", file: "Headless.tsx", label: "Headless" },
    ],
  },
];

// ── TSX → Markdown extraction ───────────────────────────────────────────────

function extractMarkdown(tsx) {
  // Strip everything before the JSX return
  let src = tsx;

  // Find the main return's JSX body
  // Match from the first `return (` after the default export to the end
  const exportStart = src.indexOf("export default function");
  if (exportStart === -1) return "";
  src = src.slice(exportStart);

  // Extract just the JSX between the outer <div>...</div>
  const returnIdx = src.indexOf("return (");
  if (returnIdx === -1) return "";
  src = src.slice(returnIdx);

  // Find matching </div> for the outer div — count nesting
  const divStart = src.indexOf("<div>");
  if (divStart === -1) {
    // Try <div className=...>
    const divStartAlt = src.search(/<div\s/);
    if (divStartAlt === -1) return "";
    // Find the closing > of this opening tag
    const closeAngle = src.indexOf(">", divStartAlt);
    src = src.slice(closeAngle + 1);
  } else {
    src = src.slice(divStart + 5);
  }

  // Remove trailing </div> ) } from the end
  src = src.replace(/<\/div>\s*\)\s*;?\s*\}?\s*$/, "");

  // ── Phase 1: Extract code blocks into placeholders ──
  const codeBlocks = [];

  // CodeBlock with template literal: code={`...`}
  src = src.replace(
    /<CodeBlock\s+code=\{`([\s\S]*?)`\}(?:\s+language="(\w+)")?(?:\s+filename="([^"]*)")?[^/]*\/>/g,
    (_match, code, lang, filename) => {
      const idx = codeBlocks.length;
      const header = filename ? `**${filename}**\n` : "";
      codeBlocks.push(`${header}\`\`\`${lang || ""}\n${code.trim()}\n\`\`\``);
      return `\n%%CODEBLOCK_${idx}%%\n`;
    },
  );

  // CodeBlock with string literal: code="..."
  src = src.replace(
    /<CodeBlock\s+code="([^"]*?)"(?:\s+language="(\w+)")?(?:\s+filename="([^"]*)")?[^/]*\/>/g,
    (_match, code, lang, filename) => {
      const idx = codeBlocks.length;
      const header = filename ? `**${filename}**\n` : "";
      codeBlocks.push(`${header}\`\`\`${lang || ""}\n${code.trim()}\n\`\`\``);
      return `\n%%CODEBLOCK_${idx}%%\n`;
    },
  );

  // ── Phase 2: Convert JSX elements to markdown ──

  // PageTitle
  src = src.replace(/<PageTitle>([\s\S]*?)<\/PageTitle>/g, "\n# $1\n");

  // Headings
  src = src.replace(/<Heading\s+level=\{2\}\s+id="[^"]*">([\s\S]*?)<\/Heading>/g, "\n## $1\n");
  src = src.replace(/<Heading\s+level=\{3\}\s+id="[^"]*">([\s\S]*?)<\/Heading>/g, "\n### $1\n");

  // Callouts
  src = src.replace(
    /<Callout\s+type="(\w+)"(?:\s+title="([^"]*)")?\s*>([\s\S]*?)<\/Callout>/g,
    (_match, type, title, body) => {
      const label = title ? `**${capitalize(type)}: ${title}**` : `**${capitalize(type)}**`;
      const text = stripInlineJsx(body).trim();
      return `\n> ${label} ${text}\n`;
    },
  );

  // List items
  src = src.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, (_match, content) => {
    return `- ${stripInlineJsx(content).trim()}\n`;
  });
  src = src.replace(/<\/?[uo]l[^>]*>/g, "\n");

  // Paragraphs — extract text content
  src = src.replace(/<p\s[^>]*>([\s\S]*?)<\/p>/g, (_match, content) => {
    return `\n${stripInlineJsx(content).trim()}\n`;
  });

  // Remove interactive components (no LLM value)
  src = src.replace(/<Example\s[^>]*\/>/g, "");
  src = src.replace(/<ExampleRunner\s[\s\S]*?\/>/g, "");
  src = src.replace(/<PageNav\s[^>]*\/>/g, "");

  // Remove JSX comments
  src = src.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

  // Remove remaining JSX block elements (divs, spans, sections used for layout)
  src = src.replace(/<\/?(?:div|span|section|br|hr|table|thead|tbody|tr|th|td)[^>]*>/g, "");

  // Strip inline JSX from remaining text
  src = stripInlineJsx(src);

  // Remove JSX expression containers: {" "}, {"text"}, {`text`}
  src = src.replace(/\{"([^"]*)"\}/g, "$1");
  src = src.replace(/\{`([^`]*)`\}/g, "$1");
  src = src.replace(/\{[\s]*\}/g, "");

  // Remove leaked style/className attributes
  src = src.replace(/style=\{\{[^}]*\}\}/g, "");
  src = src.replace(/className="[^"]*"/g, "");

  // Remove any remaining self-closing JSX tags
  src = src.replace(/<[A-Z]\w*[^>]*\/>/g, "");
  // Remove remaining opening/closing tags for custom components
  src = src.replace(/<\/?[A-Z]\w*[^>]*>/g, "");

  // ── Phase 3: Restore code blocks ──
  for (let i = 0; i < codeBlocks.length; i++) {
    src = src.replace(`%%CODEBLOCK_${i}%%`, codeBlocks[i]);
  }

  // ── Phase 4: Clean up whitespace ──
  // Strip leading whitespace from each line (JSX indentation)
  src = src
    .split("\n")
    .map((line) => {
      // Preserve indentation inside code blocks
      return line.replace(/^[ \t]+/, "");
    })
    .join("\n");

  // But we need to re-indent code block contents properly
  // Code blocks are between ``` markers — preserve their internal indentation
  // Since we already trimmed, and code was extracted pre-indentation, this should be fine

  // Collapse 3+ blank lines to 2
  src = src.replace(/\n{3,}/g, "\n\n");

  return src.trim();
}

/** Convert inline JSX elements to markdown equivalents */
function stripInlineJsx(text) {
  let s = text;
  // <code>x</code> → `x`
  s = s.replace(/<code[^>]*>([\s\S]*?)<\/code>/g, "`$1`");
  // <strong>x</strong> → **x**
  s = s.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/g, "**$1**");
  // <em>x</em> → *x*
  s = s.replace(/<em[^>]*>([\s\S]*?)<\/em>/g, "*$1*");
  // <a href="...">x</a>
  s = s.replace(/<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, "[$2]($1)");
  // <Link to="...">x</Link>
  s = s.replace(/<Link\s+to="([^"]*)"[^>]*>([\s\S]*?)<\/Link>/g, "[$2](#$1)");
  // Remove any remaining HTML/JSX tags
  s = s.replace(/<\/?[a-zA-Z][^>]*>/g, "");
  return s;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Generate llms.txt (index) ───────────────────────────────────────────────

function generateIndex() {
  const lines = [
    "# Unify Table",
    "",
    "> DuckDB-native data table & charts library for React. SQL does the work — sort, filter, group, aggregate all happen in DuckDB-WASM. 16 composable plugins, 7 display types, zero-config to fully headless.",
    "",
    "Unify Table replaces AG Grid / AG Charts with a composable, plugin-based API backed by DuckDB-WASM. The core layer has zero dependencies — pure TypeScript SQL builders and a reactive data source. The React layer provides virtualized table rendering, 16 feature plugins, side panels, and 7 display types (charts, stats, pivot, summary, correlation, timeline, outliers). Charts are powered by ECharts with SQL-driven data builders.",
    "",
  ];

  for (const section of SECTIONS) {
    lines.push(`## ${section.title}`, "");
    for (const page of section.pages) {
      lines.push(`- [${page.label}](${BASE_URL}/#${page.route}): ${getPageDescription(page)}`);
    }
    lines.push("");
  }

  lines.push("## Optional", "");
  lines.push(`- [Interactive Demo](${BASE_URL}/#/demo): Live multi-tab workspace with DuckDB-powered tables`);
  lines.push(`- [Full documentation](${BASE_URL}/llms-full.txt): Complete documentation in a single markdown file`);
  lines.push("");

  return lines.join("\n");
}

/** Short description for each page in the index */
function getPageDescription(page) {
  const DESCRIPTIONS = {
    "Getting Started": "Installation, CSS imports, and your first table in under 5 minutes",
    "How It Works": "Three-layer architecture — core SQL engine, React rendering, ECharts visualization",
    "Table Basics": "Zero-config rendering, column auto-detection, row virtualization, sorting",
    "Column Definitions": "Explicit column schemas with labels, widths, formatting, and sort behavior",
    Themes: "Built-in dark/light themes, CSS variable customization, pure CSS with no Tailwind dependency",
    "Density & Layout": "Row height presets (compact/default/comfortable), table height and overflow control",
    "Plugin Overview": "How plugins work — composition model, configuration, and the full plugin list",
    Filters: "Column-level filter inputs with composable SQL predicates — scales to millions of rows",
    Selection: "Single, multi, and range cell selection with keyboard and mouse support",
    Editing: "Inline cell editing with validation, commit/cancel, and DuckDB write-back",
    Keyboard: "Arrow keys, Tab, Enter, Escape, Delete, and Ctrl shortcuts for table navigation",
    Clipboard: "Copy/paste in TSV format, paste-as-append for adding rows from spreadsheets",
    "Column Resize": "Drag handle for column width adjustment with min/max constraints",
    "Column Pin": "Pin columns to left or right edge — pinned columns stay visible during horizontal scroll",
    "Column Reorder": "HTML5 drag-and-drop column reordering",
    "Context Menu": "Right-click menus with nested submenus, plugin-contributed items, and separators",
    Views: "Save, load, and apply view presets capturing filters, sort, groupBy, and column state",
    "Table I/O": "Import/export CSV, JSON, and Parquet files with progress events",
    "Find & Replace": "Search across the table with find, replace, and affected row count",
    Formulas: "Formula columns with expression evaluation",
    "Row Grouping": "Group by columns with expand/collapse, nested aggregations, and subtotals",
    Formatting: "Conditional cell formatting — threshold, negative, positive rules with custom styles",
    "Status Bar": "Aggregation status bar showing sum, avg, min, max for selected cells",
    Presets: "Pre-built plugin bundles — spreadsheet(), dataViewer(), readOnly()",
    Panels: "Side panel system for filters, groupBy, columns, display, export, and debug",
    "Display Overview": "7 display types that transform table data into charts, stats, pivots, and more",
    "Chart Display": "Bar, line, area, pie, donut, scatter, histogram, heatmap, treemap, funnel charts",
    "Stats Display": "Summary cards with aggregations per column — compact K/M/B/T notation",
    "Pivot Display": "Cross-tabulation matrix with row/column totals via GROUP BY + client-side pivot",
    "Summary Display": "Auto-profile every column via DuckDB SUMMARIZE with lazy histograms",
    "Correlation Display": "Pairwise Pearson correlation heatmap for numeric columns",
    "Timeline Display": "Date-bucketed time series chart using date_trunc aggregation",
    "Outliers Display": "IQR/z-score outlier detection with inline box plots and outlier table",
    Charts: "ECharts integration — SQL chart builders, sparklines, and option builder functions",
    "SQL Builder": "Immutable, chainable SQL builder — select, update, insertInto, deleteFrom",
    "Filter System": "Composable filter predicates — eq, gt, contains, oneOf, between, and/or combinators",
    "Query Engine": "TableConnection interface, QueryEngine wrapper, and DuckDB-WASM setup",
    Headless: "useTableContext hook for fully custom rendering with full TableContext access",
  };
  return DESCRIPTIONS[page.label] || page.label;
}

// ── Generate llms-full.txt (complete content) ───────────────────────────────

function generateFull() {
  const parts = [
    "# Unify Table — Complete Documentation",
    "",
    "> DuckDB-native data table & charts library for React. SQL does the work — sort, filter, group, aggregate all happen in DuckDB-WASM. 16 composable plugins, 7 display types, zero-config to fully headless.",
    "",
    "Source: " + BASE_URL,
    "",
    "---",
    "",
  ];

  for (const section of SECTIONS) {
    for (const page of section.pages) {
      const filePath = resolve(PAGES_DIR, page.file);
      try {
        const tsx = readFileSync(filePath, "utf-8");
        const md = extractMarkdown(tsx);
        if (md) {
          parts.push(md, "", "---", "");
        }
      } catch (err) {
        console.warn(`  skipped ${page.file}: ${err.message}`);
      }
    }
  }

  return parts.join("\n").trim() + "\n";
}

// ── Main ────────────────────────────────────────────────────────────────────

const index = generateIndex();
const full = generateFull();

writeFileSync(resolve(OUT_DIR, "llms.txt"), index);
writeFileSync(resolve(OUT_DIR, "llms-full.txt"), full);

console.log(`llms.txt      ${(index.length / 1024).toFixed(1)} KB`);
console.log(`llms-full.txt ${(full.length / 1024).toFixed(1)} KB`);
