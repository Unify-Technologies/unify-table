import { useCallback, useRef } from "react";
import type { DockviewApi, DockviewReadyEvent, IDockviewPanelProps } from "dockview";
import { DockviewReact } from "dockview";
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
}

export function DockLayout({ dark }: DockLayoutProps) {
  const apiRef = useRef<DockviewApi | null>(null);

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
                      data: { views: ["panel-a"], activeView: "panel-a", id: "1" },
                      size: 200,
                    },
                    {
                      type: "leaf",
                      data: { views: ["panel-new-2"], activeView: "panel-new-2", id: "6" },
                      size: 230,
                    },
                  ],
                  size: 778,
                },
                {
                  type: "leaf",
                  data: { views: ["panel-c"], activeView: "panel-c", id: "3" },
                  size: 480,
                },
                {
                  type: "leaf",
                  data: { views: ["panel-d"], activeView: "panel-d", id: "4" },
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
                  data: { views: ["panel-b"], activeView: "panel-b", id: "2" },
                  size: 894,
                },
                {
                  type: "leaf",
                  data: { views: ["panel-new-1"], activeView: "panel-new-1", id: "7" },
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
            columnWidths: { id: 80, ticker: 120, pnl: 150, region: 160, desk: 130, trade_date: 150, volume: 150, notional: 160 },
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
            aggFns: { trade_date: "max", pnl: "sum", volume: "sum", notional: "sum" },
            columnWidths: { region: 160, ticker: 120, desk: 82, trade_date: 108, notional: 141, pnl: 92, volume: 93 },
            sort: [],
            columnOrder: ["region", "ticker", "desk", "trade_date", "notional", "pnl", "volume"],
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
                config: { type: "donut", x: "region", y: { field: "volume", agg: "sum" }, series: "ticker" },
              },
            ],
            activeDisplayId: "d_1",
            groupBy: [],
            hiddenCols: [],
            aggFns: {},
            columnWidths: { id: 80, ticker: 120, pnl: 150, region: 160, desk: 130, trade_date: 150, volume: 150, notional: 160 },
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
                config: { type: "bar", x: "region", y: { field: "pnl", agg: "sum" }, series: "ticker", horizontal: true },
              },
            ],
            activeDisplayId: "d_1",
            groupBy: [],
            hiddenCols: [],
            aggFns: {},
            columnWidths: { id: 80, ticker: 120, pnl: 150, region: 160, desk: 130, trade_date: 150, volume: 150, notional: 160 },
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
            aggFns: { pnl: "sum", notional: "sum", volume: "sum", trade_date: "max" },
            columnWidths: { __group__: 176, desk: 88, trade_date: 110, notional: 141, pnl: 90, volume: 123 },
            columnOrder: ["__group__", "desk", "trade_date", "notional", "pnl", "volume"],
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
            columnWidths: { id: 80, ticker: 120, pnl: 150, region: 160, desk: 130, trade_date: 150, volume: 150, notional: 160 },
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
    event.api.fromJSON(saved as any);
  }, []);

  return (
    <div style={{ height: "100%", overflow: "hidden" }}>
      <DockviewReact
        className={dark ? "dockview-theme-unify-dark" : "dockview-theme-unify-light"}
        components={dockviewComponents}
        defaultTabComponent={DockTab}
        leftHeaderActionsComponent={AddTabButton}
        rightHeaderActionsComponent={GroupActions}
        onReady={onReady}
      />
    </div>
  );
}
