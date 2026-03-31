import { useEffect, useRef, useState } from "react";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import sql from "highlight.js/lib/languages/sql";
import bash from "highlight.js/lib/languages/bash";
import { Check, Copy } from "lucide-react";
import { useTheme } from "../providers/ThemeProvider";

hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("tsx", typescript);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("bash", bash);

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  /** When true, strips border/radius/shadow for embedding inside another card. */
  embedded?: boolean;
}

export function CodeBlock({ code, language = "tsx", filename, embedded }: CodeBlockProps) {
  const { dark } = useTheme();
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.removeAttribute("data-highlighted");
      hljs.highlightElement(codeRef.current);
    }
  }, [code, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const bg = dark ? "#12151e" : "#eee8d5";
  const borderColor = dark ? "var(--color-dark-border)" : "#d3cbb7";
  const headerBg = dark ? "#0c0e14" : "#e4dcc8";
  const textMuted = dark ? "var(--color-dark-text-muted)" : "var(--color-text-muted)";

  return (
    <div
      className={embedded ? "" : "doc-code-block"}
      style={embedded
        ? { background: bg }
        : { border: `1px solid ${borderColor}`, background: bg }
      }
    >
      {/* Header bar with filename + copy button */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: `1px solid ${borderColor}`, background: headerBg }}
      >
        <span className="text-[11px] font-mono" style={{ color: textMuted }}>
          {filename ?? language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] cursor-pointer"
          style={{ color: copied ? (dark ? "#34d399" : "#10b981") : textMuted }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code ref={codeRef} className={`language-${language}`}>
          {code.trim()}
        </code>
      </pre>
    </div>
  );
}
