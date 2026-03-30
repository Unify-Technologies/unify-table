import { useCallback, useRef } from 'react';
import type { ResolvedColumn } from '../types.js';

interface ColumnResizeOverlayProps {
  columns: ResolvedColumn[];
  onResize: (field: string, width: number) => void;
  height: number | string;
  headerHeight: number;
}

/**
 * Full-height resize handles that sit between columns.
 * Rendered as an overlay on top of the scroll area — one handle per column boundary.
 * Accessible from anywhere in the table, not just the header.
 */
export function ColumnResizeOverlay({ columns, onResize, height, headerHeight }: ColumnResizeOverlayProps) {
  const dragRef = useRef<{ field: string; startX: number; startWidth: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, col: ResolvedColumn) => {
      if (col.resizable === false) return;
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startWidth = col.currentWidth;
      dragRef.current = { field: col.field, startX, startWidth };

      const onMouseMove = (me: MouseEvent) => {
        const delta = me.clientX - startX;
        onResize(col.field, Math.max(startWidth + delta, col.minWidth ?? 50));
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        dragRef.current = null;
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [onResize]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent, col: ResolvedColumn) => {
      e.preventDefault();
      e.stopPropagation();
      onResize(col.field, col.width ?? 150);
    },
    [onResize]
  );

  // Calculate left positions for each column boundary
  let left = 0;
  const handles: { col: ResolvedColumn; left: number }[] = [];
  for (const col of columns) {
    left += col.currentWidth;
    if (col.resizable !== false) {
      handles.push({ col, left });
    }
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: headerHeight,
        height: typeof height === 'number' ? `${height - headerHeight}px` : `calc(${height} - ${headerHeight}px)`,
        marginBottom: typeof height === 'number' ? `-${height - headerHeight}px` : `calc(-${height} + ${headerHeight}px)`,
        pointerEvents: 'none',
        zIndex: 5,
        width: 'fit-content',
        minWidth: '100%',
      }}
    >
      {handles.map(({ col, left: x }) => (
        <div
          key={col.field}
          onMouseDown={(e) => handleMouseDown(e, col)}
          onDoubleClick={(e) => handleDoubleClick(e, col)}
          style={{
            position: 'absolute',
            left: x - 3,
            top: 0,
            bottom: 0,
            width: 6,
            cursor: 'col-resize',
            pointerEvents: 'auto',
          }}
          role="separator"
          aria-orientation="vertical"
          aria-label={`Resize ${col.label ?? col.field} column`}
        >
          {/* Visible line — subtle by default, brighter on hover */}
          <div
            className="resize-indicator"
            style={{
              position: 'absolute',
              left: 2,
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: 'currentColor',
              opacity: 0.08,
              transition: 'opacity 0.15s, width 0.15s',
            }}
          />
        </div>
      ))}
    </div>
  );
}
