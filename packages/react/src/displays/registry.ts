import type { DisplayDescriptor } from "./types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const descriptors = new Map<string, DisplayDescriptor<any>>();

/** Register a React display descriptor. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerDisplay<T = any>(descriptor: DisplayDescriptor<T>): void {
  descriptors.set(descriptor.type.key, descriptor);
}

/** Look up a React display descriptor by type key. */
export function getDisplay(key: string): DisplayDescriptor | undefined {
  return descriptors.get(key);
}

/** List all registered React display descriptors. */
export function listDisplays(): DisplayDescriptor[] {
  return [...descriptors.values()];
}

/** Clear all registered descriptors (for testing). */
export function clearDisplays(): void {
  descriptors.clear();
}
