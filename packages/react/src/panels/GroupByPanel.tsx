import { useCallback, useState } from "react";
import { Group, Ungroup } from "lucide-react";
import type { BuiltInPanelProps } from "./types.js";
import { DragList, makeDraggable } from "./DragList.js";
import type { DragListItem } from "./DragList.js";

export function GroupByPanel({
  columns,
  search,
  groupByCols,
  setGroupByCols,
  showTooltip,
  hideTooltip,
}: BuiltInPanelProps) {
  // Active group-by columns in order
  const activeItems: DragListItem[] = groupByCols
    .map((field) => {
      const col = columns.find((c) => c.field === field);
      return col ? { key: field, label: col.label ?? col.field } : null;
    })
    .filter(Boolean) as DragListItem[];

  // Available (ungrouped) columns, filtered by search
  const available = columns.filter(
    (c) =>
      !groupByCols.includes(c.field) &&
      (c.label ?? c.field).toLowerCase().includes(search.toLowerCase()),
  );

  const removeCol = useCallback(
    (field: string) => setGroupByCols((prev) => prev.filter((f) => f !== field)),
    [setGroupByCols],
  );

  const addCol = useCallback(
    (field: string) => setGroupByCols((prev) => [...prev, field]),
    [setGroupByCols],
  );

  const handleReorder = useCallback(
    (items: DragListItem[]) => setGroupByCols(items.map((i) => i.key)),
    [setGroupByCols],
  );

  const handleExternalDrop = useCallback(
    (key: string, insertAt: number) => {
      setGroupByCols((prev) => {
        if (prev.includes(key)) return prev;
        const next = [...prev];
        next.splice(insertAt, 0, key);
        return next;
      });
    },
    [setGroupByCols],
  );

  return (
    <div
      className="utbl-panel-section"
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      {/* Active group-by fields (ordered, draggable, accepts drops from columns zone) */}
      <div>
        {activeItems.length > 0 && (
          <div className="utbl-panel-title" style={{ marginBottom: 6 }}>
            Order
          </div>
        )}
        <DragList
          items={activeItems}
          onReorder={handleReorder}
          onExternalDrop={handleExternalDrop}
          renderTrailing={(item) => (
            <GroupToggle
              grouped={true}
              onToggle={() => removeCol(item.key)}
              showTooltip={showTooltip}
              hideTooltip={hideTooltip}
            />
          )}
        />
      </div>

      {/* Divider */}
      {available.length > 0 && <div style={{ borderTop: "1px solid var(--utbl-border)" }} />}

      {/* Available columns — draggable into the order zone, or click icon to add */}
      {available.length > 0 && (
        <div>
          <div className="utbl-panel-title" style={{ marginBottom: 6 }}>
            Columns
          </div>
          <div className="utbl-space-y-sm">
            {available.map((col) => (
              <div
                key={col.field}
                className="utbl-check-row"
                {...makeDraggable(col.field)}
                style={{ cursor: "grab" }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    color: "var(--utbl-text-muted)",
                    fontSize: "0.55rem",
                    lineHeight: 1,
                    userSelect: "none",
                  }}
                >
                  ⠿
                </span>
                <GroupToggle
                  grouped={false}
                  onToggle={() => addCol(col.field)}
                  showTooltip={showTooltip}
                  hideTooltip={hideTooltip}
                />
                {col.label ?? col.field}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GroupToggle({
  grouped,
  onToggle,
  showTooltip,
  hideTooltip,
}: {
  grouped: boolean;
  onToggle: () => void;
  showTooltip: (e: React.MouseEvent, label: string) => void;
  hideTooltip: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  // Show opposite icon on hover to preview the action
  const showGrouped = grouped ? !hovered : hovered;
  const label = grouped ? "Remove from group" : "Add to group";
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setHovered(false);
        hideTooltip();
        onToggle();
      }}
      onPointerEnter={(e) => {
        setHovered(true);
        showTooltip(e as unknown as React.MouseEvent, label);
      }}
      onPointerLeave={() => {
        setHovered(false);
        hideTooltip();
      }}
      style={{
        flexShrink: 0,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        color: grouped ? "var(--utbl-accent)" : "var(--utbl-text-muted)",
        lineHeight: 0,
        display: "flex",
        alignItems: "center",
        opacity: grouped ? 1 : 0.5,
      }}
    >
      {showGrouped ? (
        <Group size={12} strokeWidth={2.5} />
      ) : (
        <Ungroup size={12} strokeWidth={2.5} />
      )}
    </button>
  );
}
