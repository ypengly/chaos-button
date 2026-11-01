import { weightedIndex, type Rng } from '../../utils/random';
import type { ChaosEventDefinition } from './eventTypes';
import { getEventWeight } from './eventWeights';

export interface PickOptions {
  /** The event shown last. It is skipped when at least one alternative exists. */
  previousId?: string | null;
  /** Injectable random source for deterministic tests. Defaults to Math.random. */
  rng?: Rng;
}

export interface WeightedEvent {
  event: ChaosEventDefinition;
  weight: number;
  /** Chance of being picked on the next press, in [0, 1]. */
  probability: number;
}

/**
 * Events eligible for the next press. The previous event is excluded only when
 * that leaves at least one other event (so a single-event registry still works).
 */
export function getSelectableEvents(
  events: readonly ChaosEventDefinition[],
  previousId?: string | null,
): ChaosEventDefinition[] {
  if (events.length < 2 || !previousId) return [...events];
  const filtered = events.filter((event) => event.id !== previousId);
  return filtered.length > 0 ? filtered : [...events];
}

export function getSelectionWeights(
  events: readonly ChaosEventDefinition[],
  previousId?: string | null,
): WeightedEvent[] {
  const selectable = getSelectableEvents(events, previousId);
  const weights = selectable.map(getEventWeight);
  const total = weights.reduce((sum, w) => sum + w, 0);
  return selectable.map((event, index) => ({
    event,
    weight: weights[index],
    probability: total > 0 ? weights[index] / total : 1 / selectable.length,
  }));
}

export function pickEvent(
  events: readonly ChaosEventDefinition[],
  options: PickOptions = {},
): ChaosEventDefinition {
  if (events.length === 0) {
    throw new Error('No chaos events are registered.');
  }
  const rng = options.rng ?? Math.random;
  const selectable = getSelectableEvents(events, options.previousId);
  const index = weightedIndex(selectable.map(getEventWeight), rng());
  return selectable[index];
}
