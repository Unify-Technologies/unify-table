import type { ColumnInfo } from './engine.js';

export type CardSize = 'sm' | 'md' | 'lg';

/**
 * Serializable configuration for a display instance.
 * Each display tab in the UI has one of these.
 */
export interface DisplayConfig {
  /** Unique instance ID. */
  id: string;
  /** Display type key, e.g. 'chart', 'stats'. */
  type: string;
  /** User-visible label for the tab. */
  label: string;
  /** Type-specific configuration (must be JSON-serializable). */
  config: Record<string, unknown>;
}

/**
 * Definition of a display type — registered once, instantiated many times.
 * Lives in core (zero React deps) so the SQL contract is testable without a UI.
 */
export interface DisplayType<TConfig = Record<string, unknown>> {
  /** Unique type key, e.g. 'chart', 'stats'. */
  key: string;
  /** Human-readable name for the "Add display" menu. */
  label: string;
  /** Short description shown on hover in the catalogue. */
  description?: string;
  /** Build the SQL query for this display against a given view. */
  buildSql(viewName: string, config: TConfig, columns: ColumnInfo[]): string;
  /** Default config when adding a new display of this type. */
  defaultConfig(columns: ColumnInfo[]): TConfig;
  /** Validate config, return error messages or null if valid. */
  validate?(config: TConfig): string[] | null;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const displayTypes = new Map<string, DisplayType<any>>();

/** Register a display type. Overwrites any existing registration with the same key. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerDisplayType<T = any>(type: DisplayType<T>): void {
  displayTypes.set(type.key, type);
}

/** Look up a display type by key. */
export function getDisplayType(key: string): DisplayType | undefined {
  return displayTypes.get(key);
}

/** List all registered display types. */
export function listDisplayTypes(): DisplayType[] {
  return [...displayTypes.values()];
}

/** Clear all registered display types (for testing). */
export function clearDisplayTypes(): void {
  displayTypes.clear();
}
