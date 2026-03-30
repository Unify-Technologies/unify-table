import type { ReactNode } from 'react';
import type { DisplayType, QueryEngine, ColumnInfo, Row } from '@unify/table-core';

/**
 * React-side display descriptor — extends core DisplayType with rendering.
 * Register these to make display types available in the table UI.
 */
export interface DisplayDescriptor<TConfig = Record<string, unknown>> {
  /** The core display type (key, label, buildSql, defaultConfig). */
  type: DisplayType<TConfig>;
  /** Icon for the tab and "Add display" menu. */
  icon?: React.ComponentType<{ size?: number }>;
  /** Render the display output. */
  render(props: DisplayRenderProps<TConfig>): ReactNode;
  /** Render the configuration panel for this display. */
  renderConfig(props: DisplayConfigProps<TConfig>): ReactNode;
}

export interface DisplayRenderProps<TConfig = Record<string, unknown>> {
  config: TConfig;
  viewName: string;
  sql: string;
  engine: QueryEngine;
  columns: ColumnInfo[];
  /** Re-run the display query. */
  refresh: () => void;
}

export interface DisplayConfigProps<TConfig = Record<string, unknown>> {
  config: TConfig;
  onChange: (config: TConfig) => void;
  columns: ColumnInfo[];
}

/** State for tracking display data fetching. */
export interface DisplayDataState {
  rows: Row[];
  isLoading: boolean;
  error: Error | null;
}
