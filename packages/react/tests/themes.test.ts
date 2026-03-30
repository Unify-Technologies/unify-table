import { describe, it, expect } from 'vitest';
import { darkTheme, lightTheme } from '../src/themes.js';
import type { Theme } from '../src/themes.js';
import type { TableStyles } from '../src/types.js';

const STYLE_SLOTS: (keyof TableStyles)[] = [
  'header', 'headerCell', 'row', 'rowEven', 'rowSelected',
  'cell', 'footer', 'empty', 'loading', 'groupRow',
];

const PANEL_VAR_KEYS = [
  '--utbl-color-surface',
  '--utbl-color-surface-alt',
  '--utbl-color-border',
  '--utbl-color-text',
  '--utbl-color-text-secondary',
  '--utbl-color-text-muted',
  '--utbl-color-accent',
  '--utbl-color-input-bg',
  '--utbl-color-input-border',
];

function assertTheme(theme: Theme, name: string) {
  describe(name, () => {
    it('has all TableStyles slots populated', () => {
      for (const slot of STYLE_SLOTS) {
        expect(theme.styles[slot], `styles.${slot}`).toBeTruthy();
      }
    });

    it('has all panel CSS variable overrides', () => {
      for (const key of PANEL_VAR_KEYS) {
        expect(theme.panelVars[key], key).toBeTruthy();
      }
    });

    it('all panelVars keys start with --utbl-color-', () => {
      for (const key of Object.keys(theme.panelVars)) {
        expect(key).toMatch(/^--utbl-color-/);
      }
    });

    it('has a containerClass', () => {
      expect(theme.containerClass).toBeTruthy();
    });
  });
}

describe('themes', () => {
  assertTheme(darkTheme, 'darkTheme');
  assertTheme(lightTheme, 'lightTheme');

  it('dark and light themes are distinct objects', () => {
    expect(darkTheme).not.toBe(lightTheme);
    expect(darkTheme.styles).not.toEqual(lightTheme.styles);
    expect(darkTheme.panelVars).not.toEqual(lightTheme.panelVars);
    expect(darkTheme.containerClass).not.toBe(lightTheme.containerClass);
  });
});
