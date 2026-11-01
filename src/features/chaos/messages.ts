import { pickOne, type Rng } from '../../utils/random';
import type { ChaosEventDefinition } from './eventTypes';

/** Fallback pool used when an event defines no messages of its own. */
export const GENERIC_MESSAGES: readonly string[] = [
  'That was definitely a mistake.',
  'The button has chosen violence. Metaphorically.',
  'Somewhere, a developer is crying.',
  'You had one job. You pressed it.',
  'The universe is buffering.',
  'Congratulations. Nothing productive happened.',
  'Your curiosity has consequences.',
  'The button is now emotionally unavailable.',
  'We are no longer accepting responsibility.',
  'Please remain calm. Or do not.',
];

/** Returns the message pool for an event, falling back to the generic pool. */
export function getMessagePool(event: ChaosEventDefinition): readonly string[] {
  return event.messages.length > 0 ? event.messages : GENERIC_MESSAGES;
}

/**
 * Picks a message for the event, avoiding the previous message whenever another
 * option exists.
 */
export function pickMessage(
  event: ChaosEventDefinition,
  lastMessage: string | null,
  rng: Rng = Math.random,
): string {
  const pool = getMessagePool(event);
  const candidates = lastMessage ? pool.filter((message) => message !== lastMessage) : pool;
  return pickOne(candidates.length > 0 ? candidates : pool, rng);
}
