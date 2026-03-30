import type { TablePlugin, TableContext } from '../types.js';

export function columnPin(): TablePlugin {
  return {
    name: 'columnPin',
    init(ctx: TableContext) {
      // Column pinning applied via CSS sticky positioning
    },
  };
}
