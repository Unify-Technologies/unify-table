import { useState, useCallback, useEffect } from "react";
import { Moon, Sun, Search } from "lucide-react";
import { Tooltip, darkTheme, lightTheme } from "@unify/table-react";
import { Link } from "../router";
import { useTheme } from "../providers/ThemeProvider";
import { useDB } from "../providers/DuckDBProvider";
import { SearchDialog } from "../components/SearchDialog";

export function TopNav() {
  const { dark, setDark } = useTheme();
  const { initTime } = useDB();
  const [searchOpen, setSearchOpen] = useState(false);

  const surface = dark ? "var(--color-dark-surface-alt)" : "var(--color-surface-alt)";
  const border = dark ? "var(--color-dark-border)" : "var(--color-border)";
  const text = dark ? "var(--color-dark-text)" : "var(--color-text)";
  const textSecondary = dark ? "var(--color-dark-text-secondary)" : "var(--color-text-secondary)";
  const textMuted = dark ? "var(--color-dark-text-muted)" : "var(--color-text-muted)";
  const accent = dark ? "var(--color-dark-accent)" : "var(--color-accent)";
  const btnBg = dark ? "#1a1e2b" : "#e6dfcb";

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen(true);
    }
  }, []);

  // Attach global shortcut
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <header
        className="px-6 h-14 flex items-center justify-between flex-shrink-0 relative"
        style={{ borderBottom: `1px solid ${border}`, backgroundColor: surface }}
      >
        {/* Left: Logo */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-[10px]"
              style={{ backgroundColor: accent }}
            >
              UT
            </div>
            <span className="font-semibold text-sm" style={{ color: text }}>
              Unify Table
            </span>
          </Link>
          <span className="text-[10px] font-mono" style={{ color: textMuted }}>
            docs
          </span>
          {initTime != null && (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded hidden sm:inline-block"
              style={{ backgroundColor: btnBg, color: textMuted }}
            >
              DuckDB {initTime}ms
            </span>
          )}
        </div>

        {/* Center: Search — absolutely centered */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] cursor-pointer absolute left-1/2 -translate-x-1/2"
          style={{
            backgroundColor: dark ? "var(--color-dark-surface)" : "var(--color-surface)",
            border: `1px solid ${border}`,
            color: textMuted,
            minWidth: 240,
          }}
        >
          <Search size={14} />
          <span className="flex-1 text-left">Search docs...</span>
          <kbd
            className="text-[10px] font-mono px-1 py-0.5 rounded"
            style={{ backgroundColor: btnBg, color: textMuted }}
          >
            {"\u2318"}K
          </kbd>
        </button>

        {/* Right: GitHub + Theme */}
        <div className="flex items-center gap-1.5">
          <Tooltip label="GitHub" position="bottom" vars={(dark ? darkTheme : lightTheme).panelVars}>
            <a
              href="https://github.com/Unify-Technologies/unify-table"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ backgroundColor: btnBg, color: textSecondary }}
              onMouseEnter={(e) => { e.currentTarget.style.color = text; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = textSecondary; }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </a>
          </Tooltip>
          <Tooltip label={dark ? "Light mode" : "Dark mode"} position="bottom" vars={(dark ? darkTheme : lightTheme).panelVars}>
            <button
              onClick={() => setDark((d) => !d)}
              className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
              style={{ backgroundColor: btnBg, color: textSecondary }}
              onMouseEnter={(e) => { e.currentTarget.style.color = text; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = textSecondary; }}
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </Tooltip>
        </div>
      </header>

      {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} />}
    </>
  );
}
