import type { ButtonMode } from '../../hooks/useChaos';

/** Text shown on the main button for each state. */
export const BUTTON_LABELS: Record<ButtonMode, string> = {
  idle: 'PRESS FOR CHAOS',
  activated: 'CHAOS ACTIVATED!',
  rare: "YOU SHOULDN'T HAVE PRESSED THAT",
};
