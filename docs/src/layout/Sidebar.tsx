import { useState } from "react";
import { Link, useRoute } from "../router";
import { useTheme } from "../providers/ThemeProvider";
import { ChevronRight } from "lucide-react";
import { NAV_SECTIONS, type NavItem } from "./nav";

function NavLink({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const { path: currentPath } = useRoute();
  const isChildActive = item.children?.some(
    (c) => c.path === currentPath || c.children?.some((cc) => cc.path === currentPath),
  );
  const [expanded, setExpanded] = useState(isChildActive ?? false);
  const { dark } = useTheme();

  if (!item.children) {
    const isActive = currentPath === item.path;
    return (
      <Link
        to={item.path}
        className="doc-nav-item flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px]"
        style={{
          paddingLeft: 24 + depth * 12,
          color: isActive
            ? dark ? "var(--color-dark-accent)" : "var(--color-accent)"
            : dark ? "var(--color-dark-text-secondary)" : "var(--color-text-secondary)",
          ...(isActive && {
            backgroundColor: dark ? "rgba(59,130,246,0.1)" : "rgba(38,139,210,0.08)",
          }),
          fontWeight: isActive ? 500 : 400,
        }}
      >
        {item.icon && <item.icon size={14} style={{ flexShrink: 0, opacity: 0.7 }} />}
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="doc-nav-item flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] w-full cursor-pointer"
        style={{
          paddingLeft: 24 + depth * 12,
          color: isChildActive
            ? dark ? "var(--color-dark-accent)" : "var(--color-accent)"
            : dark ? "var(--color-dark-text-secondary)" : "var(--color-text-secondary)",
          fontWeight: isChildActive ? 500 : 400,
        }}
      >
        {item.icon && <item.icon size={14} style={{ flexShrink: 0, opacity: 0.7 }} />}
        {item.label}
        <ChevronRight
          size={10}
          style={{
            transition: "transform 0.15s ease",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            flexShrink: 0,
            marginLeft: "auto",
            opacity: 0.5,
          }}
        />
      </button>
      {expanded && (
        <div className="mt-0.5">
          {item.children.map((child) => (
            <NavLink key={child.path} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ className = "" }: { className?: string }) {
  const { dark } = useTheme();
  return (
    <nav
      className={`flex flex-col gap-0.5 py-4 overflow-y-auto ${className}`}
      style={{
        borderRight: `1px solid ${dark ? "var(--color-dark-border)" : "var(--color-border)"}`,
      }}
    >
      {NAV_SECTIONS.map((section, i) => (
        <div key={section.title} className={i > 0 ? "mt-4" : ""}>
          <div
            className="px-6 pb-1.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: dark ? "var(--color-dark-text-muted)" : "var(--color-text-muted)" }}
          >
            {section.title}
          </div>
          {section.items.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
        </div>
      ))}
    </nav>
  );
}
