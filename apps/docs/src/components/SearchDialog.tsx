import { useEffect, useRef, useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import { useRoute } from "../router";
import { useTheme } from "../providers/ThemeProvider";
import { SEARCH_INDEX, fuzzyMatch } from "../search";

interface SearchDialogProps {
  onClose: () => void;
}

export function SearchDialog({ onClose }: SearchDialogProps) {
  const { dark } = useTheme();
  const { navigate } = useRoute();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);

  const results = query.length > 0
    ? SEARCH_INDEX.filter((item) => fuzzyMatch(query, item))
        .slice(0, 12)
    : SEARCH_INDEX.slice(0, 12);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[selected]) {
      handleSelect(results[selected].path);
    }
  };

  const bg = dark ? "var(--color-dark-surface)" : "var(--color-surface)";
  const border = dark ? "var(--color-dark-border)" : "var(--color-border)";
  const text = dark ? "var(--color-dark-text)" : "var(--color-text)";
  const textMuted = dark ? "var(--color-dark-text-muted)" : "var(--color-text-muted)";
  const accent = dark ? "var(--color-dark-accent)" : "var(--color-accent)";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: bg, border: `1px solid ${border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${border}` }}>
          <Search size={16} style={{ color: textMuted }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search documentation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: text }}
          />
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="text-center py-6 text-sm" style={{ color: textMuted }}>
              No results found
            </p>
          ) : (
            results.map((item, i) => (
              <button
                key={item.path}
                onClick={() => handleSelect(item.path)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] cursor-pointer"
                style={{
                  backgroundColor: i === selected ? (dark ? "rgba(59,130,246,0.1)" : "rgba(38,139,210,0.08)") : "transparent",
                  color: i === selected ? accent : text,
                }}
              >
                <span className="flex-1">
                  <span className="block">{item.title}</span>
                  {item.description && (
                    <span className="block text-[11px] mt-0.5" style={{ color: textMuted }}>{item.description}</span>
                  )}
                </span>
                {item.section && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: textMuted, backgroundColor: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}>
                    {item.section}
                  </span>
                )}
                {i === selected && <ArrowRight size={12} style={{ color: accent, flexShrink: 0 }} />}
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div
          className="flex items-center gap-4 px-4 py-2 text-[11px]"
          style={{ borderTop: `1px solid ${border}`, color: textMuted }}
        >
          <span><kbd className="font-mono">Esc</kbd> to close</span>
          <span><kbd className="font-mono">{"\u2191\u2193"}</kbd> to navigate</span>
          <span><kbd className="font-mono">{"\u21B5"}</kbd> to select</span>
        </div>
      </div>
    </div>
  );
}
