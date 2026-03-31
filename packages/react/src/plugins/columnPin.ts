import { createElement } from 'react';
import type { TablePlugin, TableContext, ResolvedColumn, MenuItem } from '../types.js';
import { Pin, PinOff } from 'lucide-react';

export function columnPin(): TablePlugin {
  return {
    name: 'columnPin',
    transformColumns(columns: ResolvedColumn[]): ResolvedColumn[] {
      const left: ResolvedColumn[] = [];
      const center: ResolvedColumn[] = [];
      const right: ResolvedColumn[] = [];

      for (const col of columns) {
        if (col.pin === 'left') left.push(col);
        else if (col.pin === 'right') right.push(col);
        else center.push(col);
      }

      // Nothing pinned — skip offset computation
      if (left.length === 0 && right.length === 0) return columns;

      // Left-pinned: cumulative offset from left edge
      let offset = 0;
      for (let i = 0; i < left.length; i++) {
        left[i] = { ...left[i], _pinOffset: offset, _pinEdge: i === left.length - 1 };
        offset += left[i].currentWidth;
      }

      // Right-pinned: cumulative offset from right edge
      offset = 0;
      for (let i = right.length - 1; i >= 0; i--) {
        right[i] = { ...right[i], _pinOffset: offset, _pinEdge: i === 0 };
        offset += right[i].currentWidth;
      }

      return [...left, ...center, ...right];
    },
    headerContextMenuItems(ctx: TableContext, column: ResolvedColumn): MenuItem[] {
      const pinIcon = createElement(Pin, { size: 14 });
      const unpinIcon = createElement(PinOff, { size: 14 });

      const children: MenuItem[] = [
        {
          label: 'Pin Left',
          icon: pinIcon,
          disabled: column.pin === 'left',
          action: () => { ctx.getLatest().setColumnPin(column.field, 'left'); },
        },
        {
          label: 'Pin Right',
          icon: pinIcon,
          disabled: column.pin === 'right',
          action: () => { ctx.getLatest().setColumnPin(column.field, 'right'); },
        },
        {
          label: 'Unpin',
          icon: unpinIcon,
          disabled: !column.pin,
          action: () => { ctx.getLatest().setColumnPin(column.field, null); },
        },
      ];

      return [
        { label: '', action: () => {}, type: 'separator' },
        {
          label: 'Pin',
          icon: column.pin ? unpinIcon : pinIcon,
          action: () => {},
          children,
        },
      ];
    },
  };
}
