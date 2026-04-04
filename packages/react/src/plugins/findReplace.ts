import { useState, useEffect, useRef, createElement } from "react";
import { ChevronRight, ChevronDown, ChevronUp, X, Replace, ReplaceAll } from "lucide-react";
import type { TablePlugin, TableContext, ResolvedColumn } from "../types.js";
import type { Row } from "@unify/table-core";
import { quoteIdent, escapeString } from "@unify/table-core";
import { detectIdColumnByName, getRowId } from "../utils.js";

/* ═══════════════════════════════════════════════════════════
   Theming
   ═══════════════════════════════════════════════════════════ */

interface BarColors {
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  highlight: string;
  highlightCurrent: string;
}

const DARK_COLORS: BarColors = {
  surface: "#0c0e14",
  surfaceAlt: "#12151e",
  border: "#252a38",
  text: "#e8eaef",
  textMuted: "#5c6478",
  accent: "#3b82f6",
  highlight: "rgba(250, 204, 21, 0.15)",
  highlightCurrent: "rgba(250, 204, 21, 0.40)",
};
const LIGHT_COLORS: BarColors = {
  surface: "#fdf6e3",
  surfaceAlt: "#eee8d5",
  border: "#d3cbb7",
  text: "#073642",
  textMuted: "#93a1a1",
  accent: "#2563eb",
  highlight: "rgba(202, 138, 4, 0.15)",
  highlightCurrent: "rgba(202, 138, 4, 0.40)",
};

function detectColors(container?: Element | null): BarColors {
  const el = container ?? document.documentElement;
  return el.closest(".utbl-dark-container") ? DARK_COLORS : LIGHT_COLORS;
}

/* ═══════════════════════════════════════════════════════════
   Match computation (in-memory, runs on visible rows)
   ═══════════════════════════════════════════════════════════ */

interface Match {
  rowIndex: number;
  colIndex: number;
  field: string;
}

function computeMatches(
  rows: Row[],
  columns: ResolvedColumn[],
  query: string,
  column: string | null,
  caseSensitive: boolean,
): Match[] {
  if (!query) return [];
  const q = caseSensitive ? query : query.toLowerCase();
  const targetCols = columns
    .map((c, i) => ({ col: c, idx: i }))
    .filter(({ col }) => {
      if (column && col.field !== column) return false;
      return true;
    });

  const matches: Match[] = [];
  for (let r = 0; r < rows.length; r++) {
    if (!rows[r]) continue;
    for (const { col, idx } of targetCols) {
      const val = String(rows[r][col.field] ?? "");
      const match = caseSensitive ? val.includes(q) : val.toLowerCase().includes(q);
      if (match) matches.push({ rowIndex: r, colIndex: idx, field: col.field });
    }
  }
  return matches;
}

/* ═══════════════════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════════════════ */

function inputStyle(colors: BarColors): React.CSSProperties {
  return {
    flex: 1,
    minWidth: 160,
    padding: "4px 8px",
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    background: colors.surfaceAlt,
    color: colors.text,
    fontSize: "inherit",
    fontFamily: "inherit",
    outline: "none",
  };
}

function btnStyle(colors: BarColors, active = false): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 26,
    height: 26,
    padding: "0 6px",
    border: `1px solid ${active ? colors.accent : colors.border}`,
    borderRadius: 4,
    background: active ? colors.accent : "transparent",
    color: active ? "#fff" : colors.text,
    fontSize: "0.75rem",
    fontFamily: "monospace",
    cursor: "pointer",
    flexShrink: 0,
  };
}

function selectStyle(colors: BarColors): React.CSSProperties {
  return {
    height: 26,
    padding: "0 4px",
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    background: colors.surfaceAlt,
    color: colors.text,
    fontSize: "0.7rem",
    fontFamily: "system-ui, sans-serif",
    cursor: "pointer",
    maxWidth: 110,
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='${encodeURIComponent(colors.textMuted)}'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 4px center",
    paddingRight: 16,
  };
}

/* ═══════════════════════════════════════════════════════════
   Icon helpers
   ═══════════════════════════════════════════════════════════ */

const ICON_SIZE = 14;
const icon = (Icon: typeof X, size = ICON_SIZE) => createElement(Icon, { size });

/* ═══════════════════════════════════════════════════════════
   FindReplaceBar component
   ═══════════════════════════════════════════════════════════ */

interface BarProps {
  ctx: TableContext;
  highlightRef: React.RefObject<HighlightState>;
}

interface HighlightState {
  query: string;
  column: string | null;
  caseSensitive: boolean;
  useRegex: boolean;
  currentMatch: Match | null;
}

function FindReplaceBar({ ctx, highlightRef }: BarProps) {
  const [open, setOpen] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [matches, setMatches] = useState<Match[]>([]);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [colors, setColors] = useState<BarColors>(DARK_COLORS);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Emit highlight state for DOM highlighting in init()
  const emitHighlight = (
    q: string,
    col: string | null,
    cs: boolean,
    ur: boolean,
    current: Match | null,
  ) => {
    highlightRef.current = {
      query: q,
      column: col,
      caseSensitive: cs,
      useRegex: ur,
      currentMatch: current,
    };
    ctx.emit("findReplace:highlight", highlightRef.current);
  };

  // Listen for open/close events
  useEffect(() => {
    const unsubs = [
      ctx.on("findReplace:open", () => {
        setColors(detectColors(ctx.containerRef.current));
        setOpen(true);
        setShowReplace(false);
        setTimeout(() => searchRef.current?.focus(), 0);
      }),
      ctx.on("findReplace:openReplace", () => {
        setColors(detectColors(ctx.containerRef.current));
        setOpen(true);
        setShowReplace(true);
        setTimeout(() => searchRef.current?.focus(), 0);
      }),
      ctx.on("findReplace:close", () => {
        setOpen(false);
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [ctx]);

  // Clear highlights when closed
  useEffect(() => {
    if (!open) {
      emitHighlight("", null, false, false, null);
      setQuery("");
      setReplacement("");
      setMatchCount(0);
      setCurrentIdx(-1);
      setMatches([]);
    }
  }, [open]);

  // Escape handler — capture phase so it fires before keyboard plugin
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [open]);

  // Debounced search — callback-based to avoid useEffect stale closure issues
  const triggerSearch = (q: string, col: string | null, cs: boolean, re: boolean) => {
    if (!q) {
      setMatchCount(0);
      setCurrentIdx(-1);
      setMatches([]);
      setIsSearching(false);
      emitHighlight("", null, false, false, null);
      return;
    }
    setIsSearching(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const count = await findInTable(ctx.getLatest(), q, col || undefined, re, cs);
        setMatchCount(count);
        const live = ctx.getLatest();
        const m = computeMatches(live.rows, live.columns, q, col, cs);
        setMatches(m);
        const idx = m.length > 0 ? 0 : -1;
        setCurrentIdx(idx);
        emitHighlight(q, col, cs, re, idx >= 0 ? m[idx] : null);
      } catch {
        setMatchCount(0);
        setMatches([]);
        setCurrentIdx(-1);
        emitHighlight("", null, false, false, null);
      }
      setIsSearching(false);
    }, 300);
  };

  // Cleanup debounce on unmount
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // Navigate to current match
  useEffect(() => {
    if (currentIdx < 0 || !matches[currentIdx]) return;
    const m = matches[currentIdx];
    const live = ctx.getLatest();
    const row = live.rows[m.rowIndex];
    if (!row) return;

    // Scroll to the match row
    const container = live.containerRef.current;
    if (container) {
      const firstRowEl = container.querySelector("[data-index]") as HTMLElement | null;
      const rowHeight = firstRowEl?.offsetHeight ?? 36;
      const targetTop = m.rowIndex * rowHeight;
      if (
        targetTop < container.scrollTop ||
        targetTop > container.scrollTop + container.clientHeight - rowHeight
      ) {
        container.scrollTop = targetTop - container.clientHeight / 2 + rowHeight / 2;
      }
    }

    // Set active cell
    live.setActiveCell({
      rowIndex: m.rowIndex,
      colIndex: m.colIndex,
      rowId: getRowId(row, m.rowIndex),
      field: m.field,
      value: row[m.field],
    });

    // Update highlight for current match
    emitHighlight(query, selectedColumn, caseSensitive, useRegex, m);
  }, [currentIdx, matches]);

  if (!open) return null;

  const searchableColumns = ctx.getLatest().columns;

  const goNext = () => {
    if (matches.length === 0) return;
    setCurrentIdx((i) => (i + 1) % matches.length);
  };
  const goPrev = () => {
    if (matches.length === 0) return;
    setCurrentIdx((i) => (i - 1 + matches.length) % matches.length);
  };

  const handleReplaceCurrent = async () => {
    if (!query || isReplacing || currentIdx < 0 || !matches[currentIdx]) return;
    setIsReplacing(true);
    try {
      const live = ctx.getLatest();
      const m = matches[currentIdx];
      const row = live.rows[m.rowIndex];
      if (!row) return;

      const col = live.columns.find((c) => c.field === m.field);
      if (col?.editable === false) return;

      const oldValue = String(row[m.field] ?? "");
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const newValue = oldValue.replace(new RegExp(escaped, caseSensitive ? "" : "i"), replacement);

      if (live.editing) {
        await live.editing.commitEdit(
          {
            rowIndex: m.rowIndex,
            colIndex: m.colIndex,
            rowId: getRowId(row, m.rowIndex),
            field: m.field,
            value: oldValue,
          },
          newValue,
        );
      } else {
        const idCol = detectIdColumnByName(await live.engine.columns(live.table));
        if (idCol) {
          const rowId = row[idCol];
          await live.engine.execute(
            `UPDATE ${quoteIdent(live.table)} SET ${quoteIdent(m.field)} = ${escapeString(newValue)} WHERE ${quoteIdent(idCol)} = ${typeof rowId === "number" ? rowId : escapeString(String(rowId))}`,
          );
        }
      }
      await live.refresh();

      // Recompute matches — the replaced cell no longer matches
      const count = await findInTable(
        ctx.getLatest(),
        query,
        selectedColumn || undefined,
        useRegex,
        caseSensitive,
      );
      setMatchCount(count);
      const newMatches = computeMatches(
        ctx.getLatest().rows,
        ctx.getLatest().columns,
        query,
        selectedColumn,
        caseSensitive,
      );
      setMatches(newMatches);
      // Keep same index (now points to what was the next match); clamp if at end
      setCurrentIdx(newMatches.length > 0 ? Math.min(currentIdx, newMatches.length - 1) : -1);
    } catch {
      // silently fail
    }
    setIsReplacing(false);
  };

  const handleReplaceAll = async () => {
    if (!query || isReplacing) return;
    setIsReplacing(true);
    try {
      const live = ctx.getLatest();
      const cols = (selectedColumn
        ? [selectedColumn]
        : searchableColumns.map((c: ResolvedColumn) => c.field)
      ).filter((field) => {
        const colDef = live.columns.find((c) => c.field === field);
        return colDef?.editable !== false;
      });
      for (const col of cols) {
        await replaceInTable(live, query, replacement, col);
      }
      await live.refresh();
      const count = await findInTable(
        ctx.getLatest(),
        query,
        selectedColumn || undefined,
        useRegex,
        caseSensitive,
      );
      setMatchCount(count);
      const m = computeMatches(
        ctx.getLatest().rows,
        ctx.getLatest().columns,
        query,
        selectedColumn,
        caseSensitive,
      );
      setMatches(m);
      setCurrentIdx(m.length > 0 ? 0 : -1);
    } catch {
      // silently fail
    }
    setIsReplacing(false);
  };

  const countLabel = isSearching
    ? "Searching\u2026"
    : query
      ? matches.length > 0
        ? `${currentIdx + 1} of ${matchCount}`
        : `0 of ${matchCount}`
      : "";

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter" && !e.shiftKey) {
      goNext();
    } else if (e.key === "Enter" && e.shiftKey) {
      goPrev();
    }
  };

  // Container
  return createElement(
    "div",
    {
      style: {
        position: "absolute",
        top: 8,
        right: 8,
        zIndex: 20,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        padding: "8px 10px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        fontFamily: "system-ui, sans-serif",
        fontSize: "0.8rem",
        display: "flex",
        gap: 6,
      },
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
    },
    // Expand/collapse chevron (left side)
    createElement(
      "button",
      {
        title: showReplace ? "Hide replace" : "Show replace",
        style: {
          ...btnStyle(colors),
          border: "none",
          padding: 0,
          minWidth: 18,
          alignSelf: "flex-start",
          marginTop: 4,
        },
        onClick: () => setShowReplace((v) => !v),
      },
      showReplace ? icon(ChevronDown, 14) : icon(ChevronRight, 14),
    ),
    // Right side — rows
    createElement(
      "div",
      { style: { display: "flex", flexDirection: "column" as const, gap: 6, flex: 1 } },
      // Row 1 — search
      createElement(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 4 } },
        createElement("input", {
          ref: searchRef,
          type: "text",
          placeholder: "Find\u2026",
          value: query,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            const v = e.target.value;
            setQuery(v);
            triggerSearch(v, selectedColumn, caseSensitive, useRegex);
          },
          onKeyDown: handleSearchKeyDown,
          style: inputStyle(colors),
        }),
        // Match count
        createElement(
          "span",
          {
            style: {
              color: query && matchCount === 0 && !isSearching ? "#ef4444" : colors.textMuted,
              fontSize: "0.7rem",
              whiteSpace: "nowrap" as const,
              minWidth: 60,
              textAlign: "center" as const,
            },
          },
          countLabel,
        ),
        // Prev match
        createElement(
          "button",
          {
            title: "Previous match (Shift+Enter)",
            style: { ...btnStyle(colors), opacity: matches.length === 0 ? 0.35 : 1 },
            disabled: matches.length === 0,
            onClick: goPrev,
          },
          icon(ChevronUp, 14),
        ),
        // Next match
        createElement(
          "button",
          {
            title: "Next match (Enter)",
            style: { ...btnStyle(colors), opacity: matches.length === 0 ? 0.35 : 1 },
            disabled: matches.length === 0,
            onClick: goNext,
          },
          icon(ChevronDown, 14),
        ),
        // Case-sensitive toggle
        createElement(
          "button",
          {
            title: "Match case",
            style: btnStyle(colors, caseSensitive),
            onClick: () => {
              const next = !caseSensitive;
              setCaseSensitive(next);
              triggerSearch(query, selectedColumn, next, useRegex);
            },
          },
          "Aa",
        ),
        // Regex toggle
        createElement(
          "button",
          {
            title: "Use regular expression",
            style: btnStyle(colors, useRegex),
            onClick: () => {
              const next = !useRegex;
              setUseRegex(next);
              triggerSearch(query, selectedColumn, caseSensitive, next);
            },
          },
          ".*",
        ),
        // Column filter
        createElement(
          "select",
          {
            value: selectedColumn ?? "",
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
              const col = e.target.value || null;
              setSelectedColumn(col);
              triggerSearch(query, col, caseSensitive, useRegex);
            },
            style: selectStyle(colors),
          },
          createElement("option", { value: "" }, "All columns"),
          ...searchableColumns.map((c: ResolvedColumn) =>
            createElement("option", { key: c.field, value: c.field }, c.label ?? c.field),
          ),
        ),
        // Close
        createElement(
          "button",
          {
            title: "Close (Esc)",
            style: { ...btnStyle(colors), border: "none" },
            onClick: () => setOpen(false),
          },
          icon(X, 14),
        ),
      ),
      // Row 2 — replace (conditional)
      showReplace
        ? createElement(
            "div",
            { style: { display: "flex", alignItems: "center", gap: 4 } },
            createElement("input", {
              type: "text",
              placeholder: "Replace\u2026",
              value: replacement,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setReplacement(e.target.value),
              onKeyDown: (e: React.KeyboardEvent) => {
                e.stopPropagation();
                if (e.key === "Escape") setOpen(false);
              },
              style: inputStyle(colors),
            }),
            createElement(
              "button",
              {
                title: "Replace current match",
                style: {
                  ...btnStyle(colors),
                  padding: "0 10px",
                  gap: 4,
                  fontFamily: "system-ui, sans-serif",
                  opacity: !query || isReplacing || currentIdx < 0 ? 0.5 : 1,
                  cursor: !query || isReplacing || currentIdx < 0 ? "default" : "pointer",
                },
                disabled: !query || isReplacing || currentIdx < 0,
                onClick: handleReplaceCurrent,
              },
              icon(Replace, 12),
              "Replace",
            ),
            createElement(
              "button",
              {
                title: "Replace all occurrences",
                style: {
                  ...btnStyle(colors),
                  padding: "0 10px",
                  gap: 4,
                  fontFamily: "system-ui, sans-serif",
                  opacity: !query || isReplacing ? 0.5 : 1,
                  cursor: !query || isReplacing ? "default" : "pointer",
                },
                disabled: !query || isReplacing,
                onClick: handleReplaceAll,
              },
              icon(ReplaceAll, 12),
              isReplacing ? "Replacing\u2026" : "Replace All",
            ),
          )
        : null,
    ),
  );
}

/* ═══════════════════════════════════════════════════════════
   Plugin
   ═══════════════════════════════════════════════════════════ */

export function findReplace(): TablePlugin {
  const highlightRef: { current: HighlightState } = {
    current: { query: "", column: null, caseSensitive: false, useRegex: false, currentMatch: null },
  };

  return {
    name: "findReplace",
    dependencies: [],

    shortcuts: {
      "ctrl+f": (ctx) => ctx.emit("findReplace:open"),
      "ctrl+h": (ctx) => ctx.emit("findReplace:openReplace"),
    },

    init(ctx: TableContext) {
      if (!ctx.containerRef.current) return;
      const container = ctx.containerRef.current!;

      const isDark = () => !!container.closest(".utbl-dark-container");
      let applyingHighlights = false;

      function applyHighlights() {
        if (applyingHighlights) return;
        applyingHighlights = true;

        // Clear old highlights
        container.querySelectorAll("[data-find-hl]").forEach((el) => {
          (el as HTMLElement).style.removeProperty("background-color");
          el.removeAttribute("data-find-hl");
          el.removeAttribute("data-find-current");
        });

        const { query, column, caseSensitive, currentMatch } = highlightRef.current;
        if (!query) {
          applyingHighlights = false;
          return;
        }

        const dark = isDark();
        const hlColor = dark ? DARK_COLORS.highlight : LIGHT_COLORS.highlight;
        const currentColor = dark ? DARK_COLORS.highlightCurrent : LIGHT_COLORS.highlightCurrent;
        const q = caseSensitive ? query : query.toLowerCase();
        const cols = ctx.getLatest().columns;

        const rows = container.querySelectorAll("[data-index]");
        for (const rowEl of rows) {
          const rowIdx = Number(rowEl.getAttribute("data-index"));
          const cells = rowEl.children;
          for (let i = 0; i < cells.length && i < cols.length; i++) {
            const col = cols[i];
            if (column && col.field !== column) continue;

            const cellEl = cells[i] as HTMLElement;
            const text = cellEl.textContent ?? "";
            const match = caseSensitive ? text.includes(q) : text.toLowerCase().includes(q);

            if (match) {
              const isCurrent =
                currentMatch && currentMatch.rowIndex === rowIdx && currentMatch.colIndex === i;
              cellEl.style.backgroundColor = isCurrent ? currentColor : hlColor;
              cellEl.setAttribute("data-find-hl", "1");
              if (isCurrent) cellEl.setAttribute("data-find-current", "1");
            }
          }
        }
        applyingHighlights = false;
      }

      const unsub = ctx.on("findReplace:highlight", () => {
        applyHighlights();
      });

      // Re-apply when virtualizer swaps rows (childList changes in scroll container)
      const observer = new MutationObserver(() => {
        if (highlightRef.current.query) applyHighlights();
      });
      observer.observe(container, { childList: true, subtree: true });

      return () => {
        unsub();
        observer.disconnect();
        // Clear all highlights
        highlightRef.current = {
          query: "",
          column: null,
          caseSensitive: false,
          useRegex: false,
          currentMatch: null,
        };
        applyHighlights();
      };
    },

    renderAbove(ctx: TableContext) {
      return createElement(FindReplaceBar, {
        ctx,
        highlightRef: highlightRef as React.RefObject<HighlightState>,
      });
    },
  };
}

/* ═══════════════════════════════════════════════════════════
   SQL helpers
   ═══════════════════════════════════════════════════════════ */

/** Build the escaped ILIKE/SIMILAR TO pattern string. */
function buildPattern(query: string, useRegex: boolean): string {
  if (useRegex) return escapeString(query);
  const escaped = query.replace(/'/g, "''").replace(/%/g, "\\%").replace(/_/g, "\\_");
  return `'%${escaped}%'`;
}

/** Helper to search via SQL */
export async function findInTable(
  ctx: TableContext,
  query: string,
  column?: string,
  useRegex = false,
  caseSensitive = false,
): Promise<number> {
  const { engine, table } = ctx;
  const pattern = buildPattern(query, useRegex);
  const operator = useRegex ? "SIMILAR TO" : caseSensitive ? "LIKE" : "ILIKE";
  const escape = useRegex ? "" : " ESCAPE '\\'";

  const castCol = (name: string) => `CAST(${quoteIdent(name)} AS VARCHAR)`;

  let sql: string;
  if (column) {
    sql = `SELECT COUNT(*) AS cnt FROM ${quoteIdent(table)} WHERE ${castCol(column)} ${operator} ${pattern}${escape}`;
  } else {
    const cols = await engine.columns(table);
    if (cols.length === 0) return 0;
    const conditions = cols
      .map((c) => `${castCol(c.name)} ${operator} ${pattern}${escape}`)
      .join(" OR ");
    sql = `SELECT COUNT(*) AS cnt FROM ${quoteIdent(table)} WHERE ${conditions}`;
  }

  const rows = await engine.query<{ cnt: number }>(sql);
  return Number(rows[0]?.cnt ?? 0);
}

/** Helper to replace via SQL.
 * Routes through ctx.commitEdit so edits go through the overlay when the editing plugin is active.
 */
export async function replaceInTable(
  ctx: TableContext,
  query: string,
  replacement: string,
  column: string,
  rowIdField?: string,
): Promise<number> {
  const { engine, table } = ctx;
  const colDef = ctx.columns.find((c) => c.field === column);
  if (colDef?.editable === false) return 0;

  const qt = quoteIdent(table);
  const qc = quoteIdent(column);
  const escapedQuery = query.replace(/'/g, "''").replace(/%/g, "\\%").replace(/_/g, "\\_");
  const whereClause = `${qc} ILIKE '%${escapedQuery}%' ESCAPE '\\'`;

  let idField = rowIdField;
  if (!idField) {
    const cols = await engine.columns(table);
    idField = detectIdColumnByName(cols) || undefined;
  }

  if (idField) {
    const affectedRows = await engine.query<Record<string, unknown>>(
      `SELECT ${quoteIdent(idField)}, ${qc} FROM ${qt} WHERE ${whereClause}`,
    );
    for (const row of affectedRows) {
      const oldValue = String(row[column] ?? "");
      const newValue = oldValue.replace(
        new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        replacement,
      );
      await ctx.editing?.commitEdit(
        { rowIndex: 0, colIndex: 0, rowId: String(row[idField]), field: column, value: oldValue },
        newValue,
      );
    }
    return affectedRows.length;
  }

  const countSql = `SELECT COUNT(*) AS cnt FROM ${qt} WHERE ${whereClause}`;
  const countRows = await engine.query<{ cnt: number }>(countSql);
  const affected = Number(countRows[0]?.cnt ?? 0);

  if (affected > 0) {
    const sql = `UPDATE ${qt} SET ${qc} = REPLACE(${qc}, ${escapeString(query)}, ${escapeString(replacement)}) WHERE ${whereClause}`;
    await engine.execute(sql);
    await ctx.refresh();
  }

  return affected;
}
