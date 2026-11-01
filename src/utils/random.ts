/** A function returning a float in [0, 1). Injectable so logic can be tested deterministically. */
export type Rng = () => number;

/** Small, fast, seedable PRNG so particle layouts are stable for the lifetime of one effect. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSeed(rng: Rng): number {
  return Math.floor(rng() * 2147483647);
}

export function randomBetween(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

export function randomInt(rng: Rng, min: number, maxInclusive: number): number {
  return Math.floor(randomBetween(rng, min, maxInclusive + 1));
}

export function pickOne<T>(items: readonly T[], rng: Rng): T {
  if (items.length === 0) {
    throw new Error('pickOne: cannot pick from an empty list');
  }
  const index = Math.min(items.length - 1, Math.floor(rng() * items.length));
  return items[index];
}

/**
 * Maps a roll in [0, 1) to an index, where each index owns a slice of the range
 * proportional to its weight. Zero-weight entries are never chosen unless every
 * weight is zero, in which case the choice is uniform.
 */
export function weightedIndex(weights: readonly number[], roll: number): number {
  if (weights.length === 0) {
    throw new Error('weightedIndex: no weights provided');
  }
  const safeRoll = Math.min(Math.max(roll, 0), 0.999999999);
  const total = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
  if (total <= 0) {
    return Math.floor(safeRoll * weights.length);
  }
  const target = safeRoll * total;
  let cumulative = 0;
  for (let i = 0; i < weights.length; i += 1) {
    cumulative += Math.max(0, weights[i]);
    if (target < cumulative) {
      return i;
    }
  }
  return weights.length - 1;
}
