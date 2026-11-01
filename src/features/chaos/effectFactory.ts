import type { ActiveEffectSpec, ChaosEventDefinition, Intensity, Point } from '../../types';
import { createSeed, pickOne, type Rng } from '../../utils/random';
import { PALETTES } from './palettes';

export const LEVEL_UP_DURATION_MS = 2800;

const INTENSITY_FACTORS: Record<Intensity, number> = {
  reduced: 0,
  normal: 1,
  extra: 1.8,
};

/**
 * Combined particle multiplier. Small screens get roughly half the particles,
 * and "reduced" intensity removes motion particles entirely.
 */
export function computeDensity(intensity: Intensity, viewportWidth: number): number {
  const viewportFactor = viewportWidth < 640 ? 0.55 : 1;
  return INTENSITY_FACTORS[intensity] * viewportFactor;
}

export interface EffectContext {
  rng: Rng;
  density: number;
  origin: Point;
  emojiPool: readonly string[];
}

/** Turns a registry definition into a concrete, randomised effect instance. */
export function buildEffectSpec(event: ChaosEventDefinition, context: EffectContext): ActiveEffectSpec {
  const { rng, density, origin, emojiPool } = context;
  const hasPalette = event.effects.some((effect) => effect.type === 'palette');
  const giant = event.effects.find((effect) => effect.type === 'giantEmoji');
  return {
    eventId: event.id,
    name: event.name,
    emoji: event.emoji,
    effects: event.effects,
    durationMs: event.durationMs,
    seed: createSeed(rng),
    density,
    origin,
    emojiPool,
    palette: hasPalette ? pickOne(PALETTES, rng) : null,
    giantEmoji: giant && giant.type === 'giantEmoji' ? pickOne(giant.emojis, rng) : null,
  };
}

/** A short confetti celebration used when the player reaches a new level. */
export function buildLevelUpSpec(context: EffectContext): ActiveEffectSpec {
  return {
    eventId: null,
    name: 'Level up',
    emoji: '🏆',
    effects: [{ type: 'burst', style: 'confetti', count: 40 }],
    durationMs: LEVEL_UP_DURATION_MS,
    seed: createSeed(context.rng),
    density: context.density,
    origin: context.origin,
    emojiPool: context.emojiPool,
    palette: null,
    giantEmoji: null,
  };
}
