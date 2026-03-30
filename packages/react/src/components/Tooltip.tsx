import type { ReactNode, CSSProperties } from 'react';

interface TooltipProps {
  label: string;
  children: ReactNode;
  position?: 'top' | 'bottom';
  /** Panel CSS variable overrides (e.g. theme.panelVars) so the tooltip
   *  matches the table theme when rendered outside a .utbl-panel. */
  vars?: Record<string, string>;
  className?: string;
  style?: CSSProperties;
}

/**
 * Lightweight tooltip wrapper using the `utbl-tooltip` CSS class.
 * Renders an inline-flex span so it won't break parent flex layouts.
 * Requires `@unify/table-react/styles`.
 */
export function Tooltip({ label, children, position = 'top', vars, className, style }: TooltipProps) {
  const cls = [
    'utbl-tooltip',
    position === 'bottom' ? 'utbl-tooltip--bottom' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={cls} data-tooltip={label} style={{ display: 'inline-flex', ...vars, ...style } as CSSProperties}>
      {children}
    </span>
  );
}
