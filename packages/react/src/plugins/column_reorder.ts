import type { TablePlugin, TableContext, ResolvedColumn } from '../types.js';

export function columnReorder(): TablePlugin {
  return {
    name: 'columnReorder',

    transformColumns(columns: ResolvedColumn[]): ResolvedColumn[] {
      // Mark all non-pinned columns as draggable
      return columns.map((col) => {
        if (col.pin) return col;
        return { ...col };
      });
    },

    init(ctx: TableContext) {
      const container = ctx.containerRef.current;
      if (!container) return;
      const el: HTMLElement = container;

      // Instance-scoped drag state (not module-level)
      let sourceField: string | null = null;
      let targetField: string | null = null;

      function handleDragStart(e: DragEvent) {
        // Don't start column drag when user is on the resize handle
        if ((e.target as HTMLElement).closest('[role="separator"]')) {
          e.preventDefault();
          return;
        }
        const header = (e.target as HTMLElement).closest('[role="columnheader"]');
        if (!header) return;
        const field = (header as HTMLElement).getAttribute('data-field');
        if (!field) return;

        // Don't allow dragging pinned columns
        const latest = ctx.getLatest();
        const col = latest.columns.find((c) => c.field === field);
        if (col?.pin) {
          e.preventDefault();
          return;
        }

        sourceField = field;
        targetField = null;
        e.dataTransfer!.effectAllowed = 'move';
        e.dataTransfer!.setData('text/plain', field);
        (header as HTMLElement).style.opacity = '0.5';
      }

      function handleDragOver(e: DragEvent) {
        if (!sourceField) return;
        e.preventDefault();
        e.dataTransfer!.dropEffect = 'move';

        const header = (e.target as HTMLElement).closest('[role="columnheader"]');
        if (!header) return;
        const field = (header as HTMLElement).getAttribute('data-field');
        if (field && field !== sourceField) {
          targetField = field;
          clearDropIndicators(el);
          (header as HTMLElement).style.borderLeft = '2px solid var(--drop-indicator, #3b82f6)';
        }
      }

      function handleDrop(e: DragEvent) {
        if (!sourceField || !targetField) return;
        e.preventDefault();

        const latest = ctx.getLatest();
        const order = latest.columns.map((c) => c.field);
        const sourceIdx = order.indexOf(sourceField);
        const targetIdx = order.indexOf(targetField);

        if (sourceIdx !== -1 && targetIdx !== -1 && sourceIdx !== targetIdx) {
          order.splice(sourceIdx, 1);
          const insertIdx = order.indexOf(targetField);
          order.splice(insertIdx, 0, sourceField);
          latest.setColumnOrder(order);
        }

        cleanup();
      }

      function handleDragEnd(e: DragEvent) {
        // Reset opacity on the dragged header
        const header = (e.target as HTMLElement).closest('[role="columnheader"]');
        if (header) (header as HTMLElement).style.opacity = '';
        cleanup();
      }

      function cleanup() {
        sourceField = null;
        targetField = null;
        clearDropIndicators(el);
      }

      el.addEventListener('dragstart', handleDragStart);
      el.addEventListener('dragover', handleDragOver);
      el.addEventListener('drop', handleDrop);
      el.addEventListener('dragend', handleDragEnd);

      // Make header cells draggable
      function applyDraggable() {
        const latest = ctx.getLatest();
        const pinnedFields = new Set(latest.columns.filter((c) => c.pin).map((c) => c.field));
        const headers = el.querySelectorAll('[role="columnheader"]');
        headers.forEach((h) => {
          const field = (h as HTMLElement).getAttribute('data-field');
          const pinned = field ? pinnedFields.has(field) : false;
          (h as HTMLElement).draggable = !pinned;
          (h as HTMLElement).style.cursor = pinned ? '' : 'grab';
        });
        // Prevent resize handles from being draggable
        const separators = el.querySelectorAll('[role="separator"]');
        separators.forEach((s) => { (s as HTMLElement).draggable = false; });
      }

      const observer = new MutationObserver(applyDraggable);
      observer.observe(el, { childList: true, subtree: true });
      applyDraggable();

      return () => {
        el.removeEventListener('dragstart', handleDragStart);
        el.removeEventListener('dragover', handleDragOver);
        el.removeEventListener('drop', handleDrop);
        el.removeEventListener('dragend', handleDragEnd);
        observer.disconnect();
      };
    },
  };
}

function clearDropIndicators(container: HTMLElement) {
  const headers = container.querySelectorAll('[role="columnheader"]');
  headers.forEach((h) => {
    (h as HTMLElement).style.borderLeft = '';
  });
}
