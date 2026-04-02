import type { TablePlugin } from './types.js';
import { filters } from './plugins/filters.js';
import { editing } from './plugins/editing.js';
import { selection } from './plugins/selection.js';
import { keyboard } from './plugins/keyboard.js';
import { clipboard } from './plugins/clipboard.js';
import { columnResize } from './plugins/columnResize.js';
import { contextMenu } from './plugins/contextMenu.js';
import { views } from './plugins/views.js';
import { columnReorder } from './plugins/column_reorder.js';
import { rowGrouping } from './plugins/row_grouping.js';
import { formatting } from './plugins/formatting.js';
import { statusBar } from './plugins/status_bar.js';
import { fillHandle } from './plugins/fill_handle.js';

/** Spreadsheet preset: editing + clipboard + keyboard + filters + contextMenu + selection + columnResize + columnReorder + formatting */
export function spreadsheet(): TablePlugin[] {
  return [
    filters(),
    editing(),
    selection('range'),
    keyboard(),
    clipboard(),
    columnResize(),
    columnReorder(),
    contextMenu(),
    formatting(),
    statusBar(),
    fillHandle(),
  ];
}

/** Data viewer preset: filters + selection + columnResize + columnReorder + rowGrouping + views + formatting */
export function dataViewer(): TablePlugin[] {
  return [filters(), selection('multi'), columnResize(), columnReorder(), rowGrouping(), views(), formatting(), statusBar()];
}

/** Read-only preset: filters + columnResize + formatting */
export function readOnly(): TablePlugin[] {
  return [filters(), columnResize(), formatting()];
}
