import type { TablePlugin, TableContext } from '../types.js';
import type { FilterExpr } from '@unify/table-core';

interface FiltersOptions {
  debounce?: number;
}

export function filters(options: FiltersOptions = {}): TablePlugin {
  return {
    name: 'filters',
    init(ctx: TableContext) {
      // Plugin initialized — filter state lives in TableContext
    },
  };
}
