import { useRoute } from "../router";
import { useTheme } from "../providers/ThemeProvider";
import { NAV_SECTIONS, type NavItem } from "../layout/nav";

function findItem(items: NavItem[], path: string): NavItem | undefined {
  for (const item of items) {
    if (item.path === path) return item;
    if (item.children) {
      const found = findItem(item.children, path);
      if (found) return found;
    }
  }
}

function findIcon(path: string) {
  for (const section of NAV_SECTIONS) {
    // Check direct match first
    const direct = findItem(section.items, path);
    if (direct?.icon) return direct.icon;
    // For children without icons, use the parent's icon
    for (const item of section.items) {
      if (item.children) {
        const child = item.children.find((c) => c.path === path);
        if (child) return item.icon;
      }
    }
  }
}

export function PageTitle({ children }: { children: string }) {
  const { path } = useRoute();
  const { dark } = useTheme();
  const Icon = findIcon(path);
  const accent = dark ? "var(--color-dark-accent)" : "var(--color-accent)";

  return (
    <h1 className="flex items-center gap-2.5 text-2xl font-bold mb-2">
      {Icon && <Icon size={22} style={{ color: accent, flexShrink: 0 }} />}
      {children}
    </h1>
  );
}
