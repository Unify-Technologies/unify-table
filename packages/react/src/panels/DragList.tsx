import { useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export interface DragListItem {
  key: string;
  label: string;
}

/** Data transfer type used to identify cross-zone drags. */
const DRAG_TYPE = 'application/x-utbl-drag';

interface DragListProps {
  items: DragListItem[];
  onReorder: (items: DragListItem[]) => void;
  /** Called when an external item is dropped into this list. Receives the key and insertion index. */
  onExternalDrop?: (key: string, insertAt: number) => void;
  /** Render extra content after the label for each row. */
  renderExtra?: (item: DragListItem, index: number) => ReactNode;
  /** Render a leading element before the label (e.g. checkbox, badge). */
  renderLeading?: (item: DragListItem, index: number) => ReactNode;
  /** Render a trailing element (e.g. remove button). */
  renderTrailing?: (item: DragListItem, index: number) => ReactNode;
}

export function DragList({ items, onReorder, onExternalDrop, renderExtra, renderLeading, renderTrailing }: DragListProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const [externalOver, setExternalOver] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const isExternalDrag = (e: React.DragEvent) =>
    dragIdx === null && e.dataTransfer.types.includes(DRAG_TYPE);

  const handleDragStart = useCallback((idx: number, e: React.DragEvent) => {
    setDragIdx(idx);
    dragNode.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(DRAG_TYPE, items[idx].key);
  }, [items]);

  const handleDragOver = useCallback(
    (idx: number, e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragIdx !== null && idx !== dragIdx) {
        setDropIdx(idx);
      } else if (isExternalDrag(e)) {
        setExternalOver(idx);
      }
    },
    [dragIdx],
  );

  const handleDrop = useCallback(
    (idx: number, e: React.DragEvent) => {
      if (dragIdx !== null && dragIdx !== idx) {
        // Internal reorder
        const reordered = [...items];
        const [moved] = reordered.splice(dragIdx, 1);
        reordered.splice(idx, 0, moved);
        onReorder(reordered);
      } else if (isExternalDrag(e) && onExternalDrop) {
        // External drop
        const key = e.dataTransfer.getData(DRAG_TYPE);
        if (key) onExternalDrop(key, idx);
      }
      setDragIdx(null);
      setDropIdx(null);
      setExternalOver(null);
    },
    [dragIdx, items, onReorder, onExternalDrop],
  );

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setDropIdx(null);
    setExternalOver(null);
  }, []);

  // Drop zone at the end of the list for appending
  const handleEndDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (isExternalDrag(e)) {
        setExternalOver(items.length);
      } else if (dragIdx !== null) {
        setDropIdx(items.length);
      }
    },
    [dragIdx, items.length],
  );

  const handleEndDrop = useCallback(
    (e: React.DragEvent) => {
      const idx = items.length;
      if (dragIdx !== null && dragIdx !== idx) {
        const reordered = [...items];
        const [moved] = reordered.splice(dragIdx, 1);
        reordered.push(moved);
        onReorder(reordered);
      } else if (isExternalDrag(e) && onExternalDrop) {
        const key = e.dataTransfer.getData(DRAG_TYPE);
        if (key) onExternalDrop(key, items.length);
      }
      setDragIdx(null);
      setDropIdx(null);
      setExternalOver(null);
    },
    [dragIdx, items, onReorder, onExternalDrop],
  );

  const highlight = (idx: number) =>
    (dropIdx === idx && dragIdx !== idx) || externalOver === idx;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {items.map((item, idx) => (
        <div
          key={item.key}
          draggable
          onDragStart={(e) => handleDragStart(idx, e)}
          onDragOver={(e) => handleDragOver(idx, e)}
          onDrop={(e) => handleDrop(idx, e)}
          onDragEnd={handleDragEnd}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 2px',
            borderRadius: 'var(--utbl-radius, 3px)',
            background: highlight(idx) ? 'var(--utbl-accent)' : 'transparent',
            opacity: dragIdx === idx ? 0.4 : 1,
            cursor: 'grab',
            transition: 'background 0.1s, opacity 0.1s',
            fontSize: '0.625rem',
            color: highlight(idx) ? '#fff' : 'var(--utbl-text)',
          }}
        >
          {/* Drag handle */}
          <span
            style={{
              flexShrink: 0,
              color: highlight(idx) ? '#fff' : 'var(--utbl-text-muted)',
              fontSize: '0.55rem',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            ⠿
          </span>

          {/* Leading (checkbox, badge, etc.) */}
          {renderLeading?.(item, idx)}

          {/* Label */}
          <span
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 600,
              fontSize: '0.625rem',
            }}
          >
            {item.label}
          </span>

          {/* Extra (format, etc.) */}
          {renderExtra?.(item, idx)}

          {/* Trailing (remove button, etc.) */}
          {renderTrailing?.(item, idx)}
        </div>
      ))}

      {/* End drop zone — accepts drops to append at the end */}
      {onExternalDrop && (
        <div
          onDragOver={handleEndDragOver}
          onDrop={handleEndDrop}
          onDragLeave={() => { setExternalOver(null); setDropIdx(null); }}
          style={{
            minHeight: 24,
            borderRadius: 'var(--utbl-radius, 3px)',
            border: externalOver === items.length || dropIdx === items.length
              ? '1px dashed var(--utbl-accent)'
              : '1px dashed transparent',
            transition: 'border-color 0.1s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.5rem',
            color: 'var(--utbl-text-muted)',
          }}
        >
          {items.length === 0 ? 'Drop columns here' : ''}
        </div>
      )}
    </div>
  );
}

/** Make an element draggable as an external source for DragList. */
export function makeDraggable(key: string) {
  return {
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData(DRAG_TYPE, key);
    },
  };
}
