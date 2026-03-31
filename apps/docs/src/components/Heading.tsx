import { Link2 } from "lucide-react";
import { useTheme } from "../providers/ThemeProvider";

interface HeadingProps {
  level: 2 | 3;
  id: string;
  children: React.ReactNode;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function Heading({ level, id, children }: HeadingProps) {
  const { dark } = useTheme();
  const resolvedId = id || slugify(typeof children === "string" ? children : "");
  const Tag = level === 2 ? "h2" : "h3";

  const styles: React.CSSProperties = {
    color: dark ? "var(--color-dark-text)" : "var(--color-text)",
    scrollMarginTop: 80,
  };

  const sizeClass = level === 2 ? "text-xl font-semibold mt-10 mb-3" : "text-base font-semibold mt-8 mb-2";

  return (
    <Tag id={resolvedId} className={`group flex items-center gap-2 ${sizeClass}`} style={styles}>
      {children}
      <a
        href={`#${resolvedId}`}
        className="opacity-0 group-hover:opacity-50 transition-opacity"
        style={{ color: dark ? "var(--color-dark-text-muted)" : "var(--color-text-muted)" }}
      >
        <Link2 size={level === 2 ? 16 : 14} />
      </a>
    </Tag>
  );
}
