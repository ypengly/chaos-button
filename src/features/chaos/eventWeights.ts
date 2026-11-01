import type { ChaosEventDefinition, Rarity } from './eventTypes';

/**
 * Relative selection weights. With 15 standard events (10 each) and 3 rare events
 * (3, 3 and 1.5), rare events together show up roughly 5% of the time.
 */
export const RARITY_WEIGHTS: Record<Rarity, number> = {
  standard: 10,
  rare: 3,
};

export function getEventWeight(event: ChaosEventDefinition): number {
  const weight = event.weight ?? RARITY_WEIGHTS[event.rarity];
  return Number.isFinite(weight) && weight > 0 ? weight : 0;
}
