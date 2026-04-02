import type { TablePlugin } from '../types.js';

/**
 * Marker plugin — enables column resize handles in the table header.
 * Resize interaction is handled by HeaderRow; this plugin signals that
 * resize handles should be rendered and allows other plugins to declare
 * 'columnResize' as a dependency.
 */
export function columnResize(): TablePlugin {
  return {
    name: 'columnResize',
  };
}
