import { useMemo } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { NAV_SECTIONS } from "../layout/nav";
import { useRoute, Link } from "../router";
import { useTheme } from "../providers/ThemeProvider";

interface FlatNavEntry {
  label: string;
  path: string;
  section: string;
}

function flattenNav(): FlatNavEntry[] {
  const entries: FlatNavEntry[] = [];
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.children) {
        for (const child of item.children) {
          entries.push({ label: child.label, path: child.path, section: item.label });
        }
      } else {
        entries.push({ label: item.label, path: item.path, section: section.title });
      }
    }
  }
  return entries;
}

export function PageNav() {
  const { dark } = useTheme();
  const { path } = useRoute();
  const entries = useMemo(flattenNav, []);

  const currentIndex = entries.findIndex((e) => e.path === path);
  const prev = currentIndex > 0 ? entries[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < entries.length - 1 ? entries[currentIndex + 1] : null;

  if (!prev && !next) return null;

  const borderColor = dark ? "var(--color-dark-border)" : "var(--color-border)";
  const mutedColor = dark ? "var(--color-dark-text-muted)" : "var(--color-text-muted)";
  const textColor = dark ? "var(--color-dark-text)" : "var(--color-text)";
  const hoverBg = dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)";

  const cardStyle: React.CSSProperties = {
    border: `1px solid ${borderColor}`,
    borderRadius: 8,
    padding: "14px 18px",
    textDecoration: "none",
    transition: "background-color 0.15s ease",
    flex: "0 1 auto",
    maxWidth: "48%",
  };

  return (
    <nav
      style={{
        marginTop: 48,
        paddingTop: 24,
        borderTop: `1px solid ${borderColor}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "stretch",
        gap: 16,
      }}
    >
      {prev ? (
        <Link
          to={prev.path}
          style={cardStyle}
          className="page-nav-card"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ArrowLeft size={14} style={{ color: mutedColor, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 11, color: mutedColor, marginBottom: 2 }}>
                {prev.section}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: textColor }}>
                {prev.label}
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          to={next.path}
          style={{ ...cardStyle, textAlign: "right" }}
          className="page-nav-card"
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: mutedColor, marginBottom: 2 }}>
                {next.section}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: textColor }}>
                {next.label}
              </div>
            </div>
            <ArrowRight size={14} style={{ color: mutedColor, flexShrink: 0 }} />
          </div>
        </Link>
      ) : (
        <div />
      )}
      <style>{`
        .page-nav-card:hover {
          background-color: ${hoverBg} !important;
        }
      `}</style>
    </nav>
  );
}
