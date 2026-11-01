import type { CSSProperties } from 'react';

/** Typed helper for inline CSS custom properties (e.g. `--dx`). */
export function cssVars(vars: Record<string, string | number>): CSSProperties {
  return vars as CSSProperties;
}

/** Classes that let decorative elements and non-interactive cards react to chaos effects. */
export const FX_TARGET = 'fx-flip fx-shrink fx-floaty';
