import {
  registerDisplayType,
  chartDisplayType,
  statsDisplayType,
  pivotDisplayType,
  summaryDisplayType,
  correlationDisplayType,
  timelineDisplayType,
  outliersDisplayType,
} from '@unify/table-core';
import { registerDisplay } from './registry.js';
import { chartDisplay } from './chart_display.js';
import { statsDisplay } from './stats_display.js';
import { pivotDisplay } from './pivot_display.js';
import { summaryDisplay } from './summary_display.js';
import { correlationDisplay } from './correlation_display.js';
import { timelineDisplay } from './timeline_display.js';
import { outliersDisplay } from './outliers_display.js';

let initialized = false;

/**
 * Register built-in display types.
 * Safe to call multiple times — only registers once.
 */
export function registerDefaultDisplays(): void {
  if (initialized) return;
  initialized = true;

  // Core registry (for SQL-only usage)
  registerDisplayType(chartDisplayType);
  registerDisplayType(statsDisplayType);
  registerDisplayType(pivotDisplayType);
  registerDisplayType(summaryDisplayType);
  registerDisplayType(correlationDisplayType);
  registerDisplayType(timelineDisplayType);
  registerDisplayType(outliersDisplayType);

  // React registry (for UI rendering)
  registerDisplay(chartDisplay);
  registerDisplay(statsDisplay);
  registerDisplay(pivotDisplay);
  registerDisplay(summaryDisplay);
  registerDisplay(correlationDisplay);
  registerDisplay(timelineDisplay);
  registerDisplay(outliersDisplay);
}
