import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChartTheme } from '@unify/table-charts';
import { DARK_CHART_THEME, LIGHT_CHART_THEME } from '@unify/table-charts';

/**
 * Reads --utbl-color-* CSS variables from the DOM and returns a ChartTheme.
 * Uses a callback ref so the theme is computed after mount and updated on
 * theme toggle (detected via MutationObserver on the style attribute).
 */
export function useChartTheme(): { ref: (el: HTMLDivElement | null) => void; theme: ChartTheme } {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const [tick, setTick] = useState(0);

  const ref = useCallback((node: HTMLDivElement | null) => {
    setEl(node);
  }, []);

  // Watch for style attribute changes on ancestors (theme toggle changes inline panelVars)
  useEffect(() => {
    if (!el) return;
    const observer = new MutationObserver(() => setTick((t) => t + 1));
    // Observe the closest container that carries --utbl-color-* (usually 2-3 levels up)
    let target: HTMLElement | null = el.parentElement;
    while (target && !target.style.getPropertyValue('--utbl-color-surface')) {
      target = target.parentElement;
    }
    if (target) {
      observer.observe(target, { attributes: true, attributeFilter: ['style'] });
    }
    return () => observer.disconnect();
  }, [el]);

  const theme = useMemo((): ChartTheme => {
    // tick is only here to trigger recomputation
    void tick;
    if (!el) return DARK_CHART_THEME;

    const cs = getComputedStyle(el);
    const surface = cs.getPropertyValue('--utbl-surface').trim();
    if (!surface) return DARK_CHART_THEME;

    const isLight = isLightSurface(surface);
    const base = isLight ? LIGHT_CHART_THEME : DARK_CHART_THEME;

    const text = cs.getPropertyValue('--utbl-text').trim();
    const textSecondary = cs.getPropertyValue('--utbl-text-secondary').trim();
    const textMuted = cs.getPropertyValue('--utbl-text-muted').trim();

    return {
      text: text || base.text,
      textSecondary: textSecondary || base.textSecondary,
      textMuted: textMuted || base.textMuted,
      tooltipBg: base.tooltipBg,
      tooltipBorder: base.tooltipBorder,
      surface: surface || base.surface,
      divider: base.divider,
    };
  }, [el, tick]);

  return { ref, theme };
}

/** Simple heuristic: parse hex color and check if luminance > 0.5 */
function isLightSurface(color: string): boolean {
  const hex = color.replace('#', '');
  if (hex.length < 6) return false;
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.5;
}
