export type Rarity = 'standard' | 'rare';

/** Class-based effects: the matching CSS in index.css animates elements tagged with fx-* classes. */
export type FxToken = 'earthquake' | 'gravity' | 'tiny' | 'zoom' | 'float' | 'glitch' | 'void';

export type BurstStyle = 'confetti' | 'popcorn';
export type WashStyle = 'disco' | 'rainbow' | 'void';

export type SoundKind = 'press' | 'rare' | 'supreme' | 'levelup' | 'achievement' | 'toggle';

/** Each event is described by data; EffectsLayer interprets it. No per-event branching in the app. */
export type EffectConfig =
  | { type: 'class'; token: FxToken }
  | { type: 'rain'; count: number }
  | { type: 'burst'; style: BurstStyle; count: number }
  | { type: 'sparkles'; count: number }
  | { type: 'stars'; count: number }
  | { type: 'giantEmoji'; emojis: readonly string[] }
  | { type: 'palette' }
  | { type: 'clones'; count: number }
  | { type: 'loadingBar'; statuses: readonly string[] }
  | { type: 'dramaticText'; text: string }
  | { type: 'banner'; text: string }
  | { type: 'wash'; style: WashStyle };

export interface ChaosEventDefinition {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rarity: Rarity;
  /** How long the effect stays mounted, in milliseconds. */
  durationMs: number;
  /** Optional override of the rarity-based selection weight. */
  weight?: number;
  /** Several messages per event; one is shown per press. */
  messages: readonly string[];
  effects: readonly EffectConfig[];
  /** Optional special sound (only plays when sound is enabled). */
  sound?: SoundKind;
}

export interface Point {
  x: number;
  y: number;
}

/** Colour channels are space-separated "r g b" triples so Tailwind alpha modifiers keep working. */
export interface Palette {
  id: string;
  name: string;
  accent: string;
  accent2: string;
  btnFrom: string;
  btnTo: string;
  glow: string;
  /** Two CSS colours used for the translucent background wash. */
  tint: [string, string];
}

export interface ActiveEffect {
  id: string;
  /** Null for effects that are not registry events (for example level-up confetti). */
  eventId: string | null;
  name: string;
  emoji: string;
  effects: readonly EffectConfig[];
  startedAt: number;
  durationMs: number;
  seed: number;
  /** Combined viewport and intensity multiplier. Zero means "no motion particles". */
  density: number;
  /** Shrinks particle counts when the shared particle budget is nearly used up. */
  particleScale: number;
  origin: Point;
  emojiPool: readonly string[];
  palette: Palette | null;
  giantEmoji: string | null;
}

export type ActiveEffectSpec = Omit<ActiveEffect, 'id' | 'startedAt' | 'particleScale'>;
