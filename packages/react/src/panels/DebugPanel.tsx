import { useCallback, useMemo, useState } from "react";
import hljs from "highlight.js/lib/core";
import sql from "highlight.js/lib/languages/sql";
import type { TableContext } from "../types.js";
import { Copy, Check } from "lucide-react";

hljs.registerLanguage("sql", sql);

export function DebugPanel({ ctx }: { ctx: TableContext }) {
  const query = ctx.datasource.buildQuery();
  const [copied, setCopied] = useState(false);

  const highlighted = useMemo(() => hljs.highlight(query, { language: "sql" }).value, [query]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [query]);

  return (
    <div className="utbl-panel-section">
      <div style={{ position: "relative" }}>
        <button
          onClick={handleCopy}
          title="Copy SQL"
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            borderRadius: 4,
            color: copied ? "var(--utbl-color-accent)" : "var(--utbl-color-text-muted)",
            opacity: copied ? 1 : 0.6,
            transition: "opacity 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            if (!copied) e.currentTarget.style.opacity = "0.6";
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
        <pre
          className="hljs"
          style={{
            margin: 0,
            padding: "10px 12px",
            paddingRight: 32,
            background: "transparent",
            lineHeight: 1.7,
            fontSize: "0.75rem",
            fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            color: "var(--utbl-color-text)",
          }}
        >
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
      </div>
    </div>
  );
}
