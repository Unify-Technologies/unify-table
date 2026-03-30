import type { TablePlugin, TableContext } from '../types.js';

export function columnResize(): TablePlugin {
  return {
    name: 'columnResize',
    init(ctx: TableContext) {
      // Column resize is handled in HeaderRow component via drag events
    },
  };
}
