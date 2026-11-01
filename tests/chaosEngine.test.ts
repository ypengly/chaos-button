import { describe, expect, it } from 'vitest';
import { getSelectionWeights, pickEvent } from '../src/features/chaos/chaosEngine';
import { chaosEvents } from '../src/features/chaos/chaosEvents';
import { createRegistry, findDuplicateIds, registry } from '../src/features/chaos/eventRegistry';
import type { ChaosEventDefinition } from '../src/features/chaos/eventTypes';
import { pickMessage } from '../src/features/chaos/messages';
import { weightedIndex } from '../src/utils/random';

const make = (id: string, rarity: 'standard' | 'rare' = 'standard'): ChaosEventDefinition => ({
  id,
  name: id,
  emoji: '🎲',
  description: id,
  rarity,
  durationMs: 100,
  messages: ['a', 'b'],
  effects: [],
});

describe('event registry', () => {
  it('has unique ids', () => {
    expect(findDuplicateIds(chaosEvents)).toEqual([]);
    expect(new Set(chaosEvents.map((e) => e.id)).size).toBe(chaosEvents.length);
  });

  it('throws on duplicate ids', () => {
    expect(() => createRegistry([make('x'), make('x')])).toThrow(/Duplicate/);
  });

  it('meets the content requirements', () => {
    expect(registry.events.length - registry.rareEvents.length).toBeGreaterThanOrEqual(15);
    expect(registry.rareEvents.length).toBeGreaterThanOrEqual(3);
    for (const event of registry.events) expect(event.messages.length).toBeGreaterThan(0);
  });
});

describe('pickEvent', () => {
  it('returns a valid registered event for any roll', () => {
    for (const roll of [0, 0.25, 0.5, 0.75, 0.999999]) {
      const event = pickEvent(registry.events, { rng: () => roll });
      expect(registry.getById(event.id)).toBeDefined();
    }
  });

  it('is deterministic with an injected rng', () => {
    const a = pickEvent(registry.events, { rng: () => 0.3 });
    const b = pickEvent(registry.events, { rng: () => 0.3 });
    expect(a.id).toBe(b.id);
  });

  it('gives rare events a lower probability than standard events', () => {
    const weights = getSelectionWeights(registry.events);
    const standard = Math.max(...weights.filter((w) => w.event.rarity === 'standard').map((w) => w.probability));
    const rare = Math.max(...weights.filter((w) => w.event.rarity === 'rare').map((w) => w.probability));
    expect(rare).toBeLessThan(standard);
    const rareTotal = weights.filter((w) => w.event.rarity === 'rare').reduce((s, w) => s + w.probability, 0);
    expect(rareTotal).toBeLessThan(0.15);
  });

  it('picks rare events rarely when sampled across the whole roll range', () => {
    const samples = 2000;
    let rare = 0;
    for (let i = 0; i < samples; i += 1) {
      if (pickEvent(registry.events, { rng: () => (i + 0.5) / samples }).rarity === 'rare') rare += 1;
    }
    expect(rare / samples).toBeGreaterThan(0);
    expect(rare / samples).toBeLessThan(0.15);
  });

  it('avoids the previous event when alternatives exist', () => {
    const events = [make('a'), make('b')];
    for (const roll of [0, 0.4, 0.99]) {
      expect(pickEvent(events, { previousId: 'a', rng: () => roll }).id).toBe('b');
    }
    for (const event of registry.events) {
      for (const roll of [0, 0.5, 0.99]) {
        expect(pickEvent(registry.events, { previousId: event.id, rng: () => roll }).id).not.toBe(event.id);
      }
    }
  });

  it('still works when only one event exists', () => {
    const only = [make('solo')];
    expect(pickEvent(only, { previousId: 'solo', rng: () => 0.5 }).id).toBe('solo');
  });

  it('throws on an empty registry', () => {
    expect(() => pickEvent([])).toThrow();
  });
});

describe('weightedIndex', () => {
  it('maps rolls to weighted slices', () => {
    expect(weightedIndex([1, 3], 0.1)).toBe(0);
    expect(weightedIndex([1, 3], 0.3)).toBe(1);
    expect(weightedIndex([1, 3], 0.999)).toBe(1);
  });

  it('never picks zero-weight entries', () => {
    expect(weightedIndex([0, 5, 0], 0.0)).toBe(1);
    expect(weightedIndex([0, 5, 0], 0.99)).toBe(1);
  });

  it('falls back to uniform when all weights are zero', () => {
    expect(weightedIndex([0, 0], 0.9)).toBe(1);
  });
});

describe('pickMessage', () => {
  it('avoids repeating the previous message when possible', () => {
    const event = make('m');
    for (const roll of [0, 0.6]) {
      expect(pickMessage(event, 'a', () => roll)).toBe('b');
      expect(pickMessage(event, 'b', () => roll)).toBe('a');
    }
  });

  it('repeats when only one message exists', () => {
    const event = { ...make('one'), messages: ['only'] };
    expect(pickMessage(event, 'only', () => 0.2)).toBe('only');
  });
});
