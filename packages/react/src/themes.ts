import type { TableStyles } from './types.js';

/** A complete theme providing table styles, panel CSS variable overrides, and container class. */
export interface Theme {
  /** CSS class names for each table slot. */
  styles: TableStyles;
  /** CSS custom property overrides for panel theming (--utbl-color-*). */
  panelVars: Record<string, string>;
  /** CSS class name for the outer container (border, background, shadow). */
  containerClass: string;
}

export const darkTheme: Theme = {
  styles: {
    root: '',
    header: 'utbl-dark-header',
    headerCell: 'utbl-dark-header-cell',
    row: 'utbl-dark-row',
    rowEven: 'utbl-dark-row-even',
    rowSelected: 'utbl-dark-row-selected',
    cell: 'utbl-dark-cell',
    footer: 'utbl-dark-footer',
    empty: 'utbl-dark-empty',
    loading: 'utbl-dark-loading',
    groupRow: 'utbl-dark-group-row',
    statusBar: 'utbl-dark-status-bar',
  },
  panelVars: {
    '--utbl-color-surface': '#0c0e14',
    '--utbl-color-surface-alt': '#12151e',
    '--utbl-color-border': '#252a38',
    '--utbl-color-text': '#e8eaef',
    '--utbl-color-text-secondary': '#8b92a5',
    '--utbl-color-text-muted': '#5c6478',
    '--utbl-color-accent': '#3b82f6',
    '--utbl-color-input-bg': '#0c0e14',
    '--utbl-color-input-border': '#2d3348',
  },
  containerClass: 'utbl-dark-container',
};

export const lightTheme: Theme = {
  styles: {
    root: '',
    header: 'utbl-light-header',
    headerCell: 'utbl-light-header-cell',
    row: 'utbl-light-row',
    rowEven: 'utbl-light-row-even',
    rowSelected: 'utbl-light-row-selected',
    cell: 'utbl-light-cell',
    footer: 'utbl-light-footer',
    empty: 'utbl-light-empty',
    loading: 'utbl-light-loading',
    groupRow: 'utbl-light-group-row',
    statusBar: 'utbl-light-status-bar',
  },
  panelVars: {
    '--utbl-color-surface': '#fdf6e3',
    '--utbl-color-surface-alt': '#eee8d5',
    '--utbl-color-border': '#d3cbb7',
    '--utbl-color-text': '#073642',
    '--utbl-color-text-secondary': '#586e75',
    '--utbl-color-text-muted': '#93a1a1',
    '--utbl-color-accent': '#268bd2',
    '--utbl-color-input-bg': '#fdf6e3',
    '--utbl-color-input-border': '#c9c1ad',
  },
  containerClass: 'utbl-light-container',
};
