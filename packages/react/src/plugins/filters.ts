import type { TablePlugin } from "../types.js";

interface FiltersOptions {
  debounce?: number;
}

/**
 * Marker plugin — signals that filter UI should be shown in panels.
 * Filter logic is handled by DataSource; this plugin enables the filter panel
 * and allows other plugins to declare 'filters' as a dependency.
 */
export function filters(_options: FiltersOptions = {}): TablePlugin {
  return {
    name: "filters",
  };
}
