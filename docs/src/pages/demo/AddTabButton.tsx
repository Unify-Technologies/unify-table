import type { IDockviewHeaderActionsProps } from "dockview";
import { Plus } from "lucide-react";

let nextPanelId = 1;

export function AddTabButton(props: IDockviewHeaderActionsProps) {
  const handleAdd = () => {
    const id = `panel-new-${nextPanelId++}`;
    props.containerApi.addPanel({
      id,
      component: "table",
      title: "New Table",
      params: {
        label: "New Table",
        displayType: null,
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
        },
      },
      position: { referenceGroup: props.group },
    });
  };

  return (
    <button
      onClick={handleAdd}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "none",
        border: "none",
        color: "inherit",
        cursor: "pointer",
        padding: "0 6px",
        height: "100%",
        opacity: 0.5,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = "0.5";
      }}
    >
      <Plus size={15} />
    </button>
  );
}
