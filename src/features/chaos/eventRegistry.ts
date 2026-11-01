import { chaosEvents } from './chaosEvents';
import type { ChaosEventDefinition } from './eventTypes';

export interface EventRegistry {
  events: readonly ChaosEventDefinition[];
  rareEvents: readonly ChaosEventDefinition[];
  getById: (id: string) => ChaosEventDefinition | undefined;
}

export function findDuplicateIds(events: readonly ChaosEventDefinition[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const event of events) {
    if (seen.has(event.id)) duplicates.add(event.id);
    seen.add(event.id);
  }
  return [...duplicates];
}

export function createRegistry(events: readonly ChaosEventDefinition[]): EventRegistry {
  const duplicates = findDuplicateIds(events);
  if (duplicates.length > 0) {
    throw new Error(`Duplicate chaos event ids: ${duplicates.join(', ')}`);
  }
  const byId = new Map(events.map((event) => [event.id, event]));
  return {
    events,
    rareEvents: events.filter((event) => event.rarity === 'rare'),
    getById: (id) => byId.get(id),
  };
}

export const registry: EventRegistry = createRegistry(chaosEvents);
