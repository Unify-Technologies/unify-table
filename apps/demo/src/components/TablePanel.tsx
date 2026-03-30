import { useCallback, useContext, useMemo } from "react";
import type { TablePlugin } from "@unify/table-react";
import {
  Table,
  clipboard,
  columnReorder,
  columnResize,
  contextMenu,
  darkTheme,
  editing,
  filters,
  formatting,
  keyboard,
  lightTheme,
  negative,
  positive,
  rowGrouping,
  selection,
  statusBar,
} from "@unify/table-react";
import type { DisplayConfig, SortField } from "@unify/table-core";
import type { IDockviewPanelProps } from "dockview";
import { DemoContext } from "../context/DemoContext";
import { COLUMNS } from "../config/columns";

interface PanelParams {
  label: string;
  displayType?: string | null;
  displays?: DisplayConfig[];
  activeDisplayId?: string | null;
  sort?: SortField[];
  filterValues?: Record<string, string>;
  groupBy?: string[];
  hiddenCols?: string[];
  aggFns?: Record<string, string>;
  columnOrder?: string[];
  columnWidths?: Record<string, number>;
}

/** Create a callback that persists a single key to dockview panel params. */
function useSyncParam<K extends keyof PanelParams>(
  api: IDockviewPanelProps<PanelParams>["api"],
  key: K,
): (value: PanelParams[K]) => void {
  return useCallback(
    (value: PanelParams[K]) => {
      api.updateParameters({ [key]: value });
    },
    [api, key],
  );
}

export function TablePanel(props: IDockviewPanelProps<PanelParams>) {
  const { db, dark } = useContext(DemoContext);
  const theme = dark ? darkTheme : lightTheme;

  const onActiveDisplayChange = useSyncParam(props.api, "displayType");
  const onSortChange = useSyncParam(props.api, "sort");
  const onFilterValuesChange = useSyncParam(props.api, "filterValues");
  const onGroupByChange = useSyncParam(props.api, "groupBy");
  const onHiddenColsChange = useSyncParam(props.api, "hiddenCols");
  const onAggFnsChange = useSyncParam(props.api, "aggFns");
  const onColumnOrderChange = useSyncParam(props.api, "columnOrder");
  const onColumnWidthsChange = useSyncParam(props.api, "columnWidths");

  const onDisplaysChange = useCallback(
    (displays: DisplayConfig[]) => {
      const active = displays.length > 0 ? displays[0].id : null;
      props.api.updateParameters({ displays, activeDisplayId: active });
    },
    [props.api],
  );

  const plugins = useMemo<TablePlugin[]>(
    () => [
      filters(),
      editing(),
      selection("multi"),
      keyboard(),
      clipboard(),
      columnResize(),
      columnReorder(),
      rowGrouping(),
      contextMenu(),
      statusBar(),
      formatting({
        pnl: [
          ...negative(dark ? "#ef4444" : "#dc2626"),
          ...positive(dark ? "#22c55e" : "#16a34a"),
        ],
        notional: [
          ...negative(dark ? "#ef4444" : "#dc2626"),
          ...positive(dark ? "#22c55e" : "#16a34a"),
        ],
        volume: [
          {
            when: (v) => typeof v === "number" && v > 40000,
            style: { color: dark ? "#60a5fa" : "#2563eb", fontWeight: "600" },
          },
          {
            when: (v) => typeof v === "number" && v < 5000,
            style: { opacity: "0.4" },
          },
        ],
      }),
    ],
    [dark],
  );

  return (
    <div
      className={theme.containerClass}
      style={
        {
          height: "100%",
          display: "flex",
          flexDirection: "column",
          ...theme.panelVars,
        } as React.CSSProperties
      }
    >
      <div style={{ flex: 1, minHeight: 0 }}>
        <Table
          db={db}
          table="trades"
          columns={COLUMNS}
          plugins={plugins}
          styles={theme.styles}
          density="compact"
          height="100%"
          displays={props.params.displays}
          initialActiveDisplay={props.params.activeDisplayId}
          onActiveDisplayChange={onActiveDisplayChange}
          onDisplaysChange={onDisplaysChange}
          initialSort={props.params.sort}
          onSortChange={onSortChange}
          initialFilterValues={props.params.filterValues}
          onFilterValuesChange={onFilterValuesChange}
          initialGroupBy={props.params.groupBy}
          onGroupByChange={onGroupByChange}
          initialHiddenCols={props.params.hiddenCols}
          onHiddenColsChange={onHiddenColsChange}
          initialAggFns={props.params.aggFns}
          onAggFnsChange={onAggFnsChange}
          initialColumnOrder={props.params.columnOrder}
          onColumnOrderChange={onColumnOrderChange}
          initialColumnWidths={props.params.columnWidths}
          onColumnWidthsChange={onColumnWidthsChange}
        />
      </div>
    </div>
  );
}
