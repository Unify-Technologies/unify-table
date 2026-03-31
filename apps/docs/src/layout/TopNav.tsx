import { useState, useCallback, useEffect } from "react";
import { Moon, Sun, Search } from "lucide-react";
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

        {/* Right: Theme + GitHub */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDark((d) => !d)}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
            style={{ backgroundColor: btnBg, color: textSecondary }}
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} />}
    </>
  );
}
