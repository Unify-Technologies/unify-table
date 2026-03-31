import { useEffect, useState } from "react";
import { useTheme } from "../providers/ThemeProvider";
import { useRoute } from "../router";

interface TocEntry {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const { dark } = useTheme();
  const { path } = useRoute();
  const [entries, setEntries] = useState<TocEntry[]>([]);
  const [activeId, setActiveId] = useState("");

  // Extract headings from the content area whenever the page changes.
  // Use MutationObserver to detect when headings are rendered (async examples, etc.)
  useEffect(() => {
    const content = document.getElementById("doc-content");
    if (!content) return;

    const scan = () => {
      const headings = content.querySelectorAll("h2[id], h3[id]");
      const items: TocEntry[] = [];
      headings.forEach((h) => {
        items.push({
          id: h.id,
          text: h.textContent?.replace(/#$/, "").trim() ?? "",
          level: h.tagName === "H2" ? 2 : 3,
        });
      });
      setEntries(items);
    };

    // Initial scan after a short delay for rendering
    const timer = setTimeout(scan, 300);

    // Re-scan when DOM changes (async examples load headings later)
    const observer = new MutationObserver(scan);
    observer.observe(content, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [path]);

  // Track active heading via IntersectionObserver
  useEffect(() => {
    if (entries.length === 0) return;
    const observer = new IntersectionObserver(
      (obs) => {
        for (const entry of obs) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );
    for (const e of entries) {
      const el = document.getElementById(e.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  const mutedColor = dark ? "var(--color-dark-text-muted)" : "var(--color-text-muted)";
  const secondaryColor = dark ? "var(--color-dark-text-secondary)" : "var(--color-text-secondary)";
  const accentColor = dark ? "var(--color-dark-accent)" : "var(--color-accent)";

  return (
    <nav className="flex flex-col gap-0.5 py-4 overflow-y-auto">
      <div
        className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: mutedColor }}
      >
        On this page
      </div>
      {entries.map((e) => {
        const isActive = activeId === e.id;
        return (
          <a
            key={e.id}
            href={`#${e.id}`}
            className="doc-toc-item flex items-center px-3 py-1.5 rounded-md text-[13px]"
            style={{
              paddingLeft: e.level === 3 ? 24 : 12,
              color: isActive ? accentColor : secondaryColor,
              fontWeight: isActive ? 500 : 400,
              ...(isActive && {
                backgroundColor: dark ? "rgba(59,130,246,0.1)" : "rgba(38,139,210,0.08)",
              }),
            }}
            onClick={(ev) => {
              ev.preventDefault();
              document.getElementById(e.id)?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            {e.text}
          </a>
        );
      })}
    </nav>
  );
}
