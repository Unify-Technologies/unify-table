import type { LucideIcon } from "lucide-react";
import {
  Home,
  Rocket,
  Cog,
  Play,
  Table,
  Columns3,
  Palette,
  AlignVerticalSpaceAround,
  Puzzle,
  Layers,
  PanelRight,
  Monitor,
  BarChart3,
  Code2,
  Filter,
  Database,
  Terminal,
  BotMessageSquare,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon?: LucideIcon;
  children?: NavItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Home", path: "/", icon: Home },
      { label: "Getting Started", path: "/getting-started", icon: Rocket },
      { label: "How It Works", path: "/how-it-works", icon: Cog },
      { label: "Demo", path: "/demo", icon: Play },
    ],
  },
  {
    title: "Core Concepts",
    items: [
      { label: "Table Basics", path: "/table-basics", icon: Table },
      { label: "Column Definitions", path: "/column-definitions", icon: Columns3 },
      { label: "Themes", path: "/themes", icon: Palette },
      { label: "Density & Layout", path: "/density-layout", icon: AlignVerticalSpaceAround },
    ],
  },
  {
    title: "Features",
    items: [
      {
        label: "Plugins",
        path: "/plugins",
        icon: Puzzle,
        children: [
          { label: "Overview", path: "/plugins" },
          { label: "Filters", path: "/plugins/filters" },
          { label: "Selection", path: "/plugins/selection" },
          { label: "Editing", path: "/plugins/editing" },
          { label: "Keyboard", path: "/plugins/keyboard" },
          { label: "Clipboard", path: "/plugins/clipboard" },
          { label: "Column Resize", path: "/plugins/column-resize" },
          { label: "Column Pin", path: "/plugins/column-pin" },
          { label: "Column Reorder", path: "/plugins/column-reorder" },
          { label: "Context Menu", path: "/plugins/context-menu" },
          { label: "Views", path: "/plugins/views" },
          { label: "Table I/O", path: "/plugins/table-io" },
          { label: "Find & Replace", path: "/plugins/find-replace" },
          { label: "Formulas", path: "/plugins/formulas" },
          { label: "Row Grouping", path: "/plugins/row-grouping" },
          { label: "Formatting", path: "/plugins/formatting" },
          { label: "Status Bar", path: "/plugins/status-bar" },
        ],
      },
      { label: "Presets", path: "/presets", icon: Layers },
      { label: "Panels", path: "/panels", icon: PanelRight },
    ],
  },
  {
    title: "Displays & Charts",
    items: [
      {
        label: "Displays",
        path: "/displays",
        icon: Monitor,
        children: [
          { label: "Overview", path: "/displays" },
          { label: "Chart", path: "/displays/chart" },
          { label: "Stats", path: "/displays/stats" },
          { label: "Pivot", path: "/displays/pivot" },
          { label: "Summary", path: "/displays/summary" },
          { label: "Correlation", path: "/displays/correlation" },
          { label: "Timeline", path: "/displays/timeline" },
          { label: "Outliers", path: "/displays/outliers" },
        ],
      },
      { label: "Charts", path: "/charts", icon: BarChart3 },
    ],
  },
  {
    title: "Data Layer",
    items: [
      { label: "SQL Builder", path: "/sql-builder", icon: Code2 },
      { label: "Filter System", path: "/filter-system", icon: Filter },
      { label: "Query Engine", path: "/query-engine", icon: Database },
      { label: "Headless", path: "/headless", icon: Terminal },
    ],
  },
  {
    title: "Integrations",
    items: [
      { label: "For LLMs", path: "/llm-docs", icon: BotMessageSquare },
    ],
  },
];

/** Flat list of all nav items for search and routing */
export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);
