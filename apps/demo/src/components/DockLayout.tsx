import { useCallback, useRef, useState } from "react";
import type { DockviewApi, DockviewReadyEvent, IDockviewPanelProps } from "dockview";
import { DockviewReact } from "dockview";
import { Check, Copy, Moon, Sun } from "lucide-react";
import { Tooltip } from "@unify/table-react";
import { TablePanel } from "./TablePanel";
import { DockTab } from "./DockTab";
import { GroupActions } from "./GroupActions";
import { AddTabButton } from "./AddTabButton";

const dockviewComponents: Record<
  string,
  React.FunctionComponent<IDockviewPanelProps>
> = {
  table: TablePanel,
};

interface DockLayoutProps {
  dark: boolean;
  setDark: (fn: (d: boolean) => boolean) => void;
  initTime: number | null;
}

export function DockLayout({ dark, setDark, initTime }: DockLayoutProps) {
  const apiRef = useRef<DockviewApi | null>(null);
  const [copied, setCopied] = useState(false);

  const surface = dark ? "var(--color-dark-surface)" : "var(--color-surface)";
  const surfaceAlt = dark
    ? "var(--color-dark-surface-alt)"
    : "var(--color-surface-alt)";
  const border = dark ? "var(--color-dark-border)" : "var(--color-border)";
  const text = dark ? "var(--color-dark-text)" : "var(--color-text)";
  const textSecondary = dark
    ? "var(--color-dark-text-secondary)"
    : "var(--color-text-secondary)";
  const textMuted = dark
    ? "var(--color-dark-text-muted)"
    : "var(--color-text-muted)";
  const accent = dark ? "var(--color-dark-accent)" : "var(--color-accent)";

  // Tooltip theme vars — sets --utbl-color-* so .utbl-tooltip resolves matching colors
  const tooltipVars = dark
    ? { '--utbl-color-text': '#e8eaef', '--utbl-color-surface': '#0c0e14' }
    : { '--utbl-color-text': '#073642', '--utbl-color-surface': '#fdf6e3' };

  const handleCopyLayout = useCallback(() => {
    if (!apiRef.current) return;
    const layout = {
      version: 1,
      dark,
      dockview: apiRef.current.toJSON(),
    };
    navigator.clipboard.writeText(JSON.stringify(layout, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [dark]);

  const onReady = useCallback((event: DockviewReadyEvent) => {
    apiRef.current = event.api;
    const saved = {
      grid: {
        root: {
          type: "branch",
          data: [
            {
              type: "branch",
              data: [
                {
                  type: "branch",
                  data: [
                    {
                      type: "leaf",
                      data: {
                        views: ["panel-a"],
                        activeView: "panel-a",
                        id: "1",
                      },
                      size: 200,
                    },
                    {
                      type: "leaf",
                      data: {
                        views: ["panel-new-2"],
                        activeView: "panel-new-2",
                        id: "6",
                      },
                      size: 230,
                    },
                  ],
                  size: 778,
                },
                {
                  type: "leaf",
                  data: {
                    views: ["panel-c"],
                    activeView: "panel-c",
                    id: "3",
                  },
                  size: 480,
                },
                {
                  type: "leaf",
                  data: {
                    views: ["panel-d"],
                    activeView: "panel-d",
                    id: "4",
                  },
                  size: 530,
                },
              ],
              size: 430,
            },
            {
              type: "branch",
              data: [
                {
                  type: "leaf",
                  data: {
                    views: ["panel-b"],
                    activeView: "panel-b",
                    id: "2",
                  },
                  size: 894,
                },
                {
                  type: "leaf",
                  data: {
                    views: ["panel-new-1"],
                    activeView: "panel-new-1",
                    id: "7",
                  },
                  size: 894,
                },
              ],
              size: 553,
            },
          ],
          size: 1788,
        },
        width: 1788,
        height: 983,
        orientation: "VERTICAL",
      },
      panels: {
        "panel-a": {
          id: "panel-a",
          contentComponent: "table",
          tabComponent: "props.defaultTabComponent",
          params: {
            label: "Stats",
            displayType: "stats",
            displays: [
              {
                id: "d_1",
                type: "stats",
                label: "Stats",
                config: {
                  fields: [
                    { field: "pnl", aggs: ["sum", "min", "max"] },
                    { field: "volume", aggs: ["sum", "min", "max"] },
                    { field: "notional", aggs: ["sum", "min", "max"] },
                  ],
                  layout: "row",
                },
              },
            ],
            activeDisplayId: "d_1",
            groupBy: [],
            hiddenCols: [],
            aggFns: {},
            columnWidths: {
              id: 80,
              ticker: 120,
              pnl: 150,
              region: 160,
              desk: 130,
              trade_date: 150,
              volume: 150,
              notional: 160,
            },
          },
          title: "PnL & Volume",
        },
        "panel-b": {
          id: "panel-b",
          contentComponent: "table",
          tabComponent: "props.defaultTabComponent",
          params: {
            label: "Trades",
            displayType: null,
            groupBy: [],
            hiddenCols: ["id"],
            aggFns: {
              trade_date: "max",
              pnl: "sum",
              volume: "sum",
              notional: "sum",
            },
            columnWidths: {
              region: 160,
              ticker: 120,
              desk: 82,
              trade_date: 108,
              notional: 141,
              pnl: 92,
              volume: 93,
            },
            sort: [],
            columnOrder: [
              "region",
              "ticker",
              "desk",
              "trade_date",
              "notional",
              "pnl",
              "volume",
            ],
          },
          title: "Trades",
        },
        "panel-c": {
          id: "panel-c",
          contentComponent: "table",
          tabComponent: "props.defaultTabComponent",
          params: {
            label: "Volume",
            displayType: "chart",
            displays: [
              {
                id: "d_1",
                type: "chart",
                label: "Chart",
                config: {
                  type: "donut",
                  x: "region",
                  y: { field: "volume", agg: "sum" },
                  series: "ticker",
                },
              },
            ],
            activeDisplayId: "d_1",
            groupBy: [],
            hiddenCols: [],
            aggFns: {},
            columnWidths: {
              id: 80,
              ticker: 120,
              pnl: 150,
              region: 160,
              desk: 130,
              trade_date: 150,
              volume: 150,
              notional: 160,
            },
          },
          title: "Volume by Region",
        },
        "panel-d": {
          id: "panel-d",
          contentComponent: "table",
          tabComponent: "props.defaultTabComponent",
          params: {
            label: "PnL",
            displayType: "chart",
            displays: [
              {
                id: "d_1",
                type: "chart",
                label: "Chart",
                config: {
                  type: "bar",
                  x: "region",
                  y: { field: "pnl", agg: "sum" },
                  series: "ticker",
                  horizontal: true,
                },
              },
            ],
            activeDisplayId: "d_1",
            groupBy: [],
            hiddenCols: [],
            aggFns: {},
            columnWidths: {
              id: 80,
              ticker: 120,
              pnl: 150,
              region: 160,
              desk: 130,
              trade_date: 150,
              volume: 150,
              notional: 160,
            },
          },
          title: "PnL by Region",
        },
        "panel-new-2": {
          id: "panel-new-2",
          contentComponent: "table",
          tabComponent: "props.defaultTabComponent",
          params: {
            label: "New Table",
            displayType: null,
            groupBy: ["region", "ticker"],
            hiddenCols: ["id"],
            aggFns: {
              pnl: "sum",
              notional: "sum",
              volume: "sum",
              trade_date: "max",
            },
            columnWidths: {
              __group__: 176,
              desk: 88,
              trade_date: 110,
              notional: 141,
              pnl: 90,
              volume: 123,
            },
            columnOrder: [
              "__group__",
              "desk",
              "trade_date",
              "notional",
              "pnl",
              "volume",
            ],
          },
          title: "Region/Ticker Trades",
        },
        "panel-new-1": {
          id: "panel-new-1",
          contentComponent: "table",
          tabComponent: "props.defaultTabComponent",
          params: {
            label: "New Table",
            displayType: "timeline",
            groupBy: [],
            hiddenCols: [],
            aggFns: {},
            columnWidths: {
              id: 80,
              ticker: 120,
              pnl: 150,
              region: 160,
              desk: 130,
              trade_date: 150,
              volume: 150,
              notional: 160,
            },
            displays: [
              {
                id: "d_1",
                type: "timeline",
                label: "Timeline",
                config: {
                  dateField: "trade_date",
                  bucket: "month",
                  agg: "sum",
                  valueField: "pnl",
                  chartType: "area",
                  series: "region",
                  stacked: false,
                },
              },
            ],
            activeDisplayId: "d_1",
          },
          title: "PnL by Region over Time",
        },
      },
      activeGroup: "2",
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event.api.fromJSON(saved as any);
  }, []);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: surface, color: text }}
    >
      {/* Header */}
      <header
        className="px-6 h-12 flex items-center justify-between flex-shrink-0"
        style={{
          borderBottom: `1px solid ${border}`,
          backgroundColor: surfaceAlt,
        }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-[10px]"
              style={{ backgroundColor: accent }}
            >
              UT
            </div>
            <span className="font-semibold text-sm" style={{ color: text }}>
              Unify Table
            </span>
          </div>
          <span className="text-[10px] font-mono" style={{ color: textMuted }}>
            demo
          </span>
          {initTime && (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: dark ? "#1a1e2b" : "#e6dfcb",
                color: textMuted,
              }}
            >
              DuckDB {initTime}ms
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Tooltip label={copied ? "Copied!" : "Copy layout"} position="bottom" vars={tooltipVars}>
            <button
              onClick={handleCopyLayout}
              className="w-7 h-7 rounded flex items-center justify-center cursor-pointer"
              style={{
                backgroundColor: dark ? "#1a1e2b" : "#e6dfcb",
                color: copied ? (dark ? "#34d399" : "#10b981") : textSecondary,
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </Tooltip>
          <Tooltip label={dark ? "Light mode" : "Dark mode"} position="bottom" vars={tooltipVars}>
            <button
              onClick={() => setDark((d) => !d)}
              className="w-7 h-7 rounded flex items-center justify-center cursor-pointer"
              style={{
                backgroundColor: dark ? "#1a1e2b" : "#e6dfcb",
                color: textSecondary,
              }}
            >
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </Tooltip>
        </div>
      </header>

      {/* Dockview Layout */}
      <div
        style={{ flex: 1, overflow: "hidden", height: "calc(100vh - 48px)" }}
      >
        <DockviewReact
          className={
            dark ? "dockview-theme-unify-dark" : "dockview-theme-unify-light"
          }
          components={dockviewComponents}
          defaultTabComponent={DockTab}
          leftHeaderActionsComponent={AddTabButton}
          rightHeaderActionsComponent={GroupActions}
          onReady={onReady}
        />
      </div>
    </div>
  );
}
