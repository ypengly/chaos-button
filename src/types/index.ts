export type {
  ActiveEffect,
  ActiveEffectSpec,
  ChaosEventDefinition,
  EffectConfig,
  Palette,
  Point,
  Rarity,
  SoundKind,
} from '../features/chaos/eventTypes';

import type { Rarity } from '../features/chaos/eventTypes';

export type ThemeName = 'light' | 'dark' | 'chaos';
export type ButtonColor = 'violet' | 'coral' | 'blue' | 'sunny' | 'pink';
export type EmojiTheme = 'party' | 'food' | 'space' | 'animals';
export type Intensity = 'reduced' | 'normal' | 'extra';

export interface Settings {
  theme: ThemeName;
  buttonColor: ButtonColor;
  emojiTheme: EmojiTheme;
  intensity: Intensity;
  soundEnabled: boolean;
  decorations: boolean;
}

/** Statistics for the current browser session. Persisted in sessionStorage only. */
export interface SessionStats {
  startedAt: number;
  presses: number;
  discoveredEventIds: string[];
  rareEventIds: string[];
}

/** Statistics kept across visits in localStorage until the user resets them. */
export interface LifetimeStats {
  totalPresses: number;
  discoveredEventIds: string[];
  rareEventIds: string[];
  highestLevel: number;
}

/** Map of achievement id to the ISO timestamp it was unlocked. */
export type AchievementRecord = Record<string, string>;

export interface LevelDefinition {
  level: number;
  title: string;
  description: string;
  /** First press count that belongs to this level. */
  min: number;
  /** Last press count that belongs to this level, or null for the final level. */
  max: number | null;
}

export interface LevelInfo extends LevelDefinition {
  /** Presses completed inside this level. */
  pressesIntoLevel: number;
  /** Progress through this level as a fraction in [0, 1]. */
  progress: number;
  /** Presses still needed to reach the next level, or null at the top level. */
  pressesToNext: number | null;
  nextTitle: string | null;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  target: number;
  progress: (lifetime: LifetimeStats) => number;
}

export interface FeedEntry {
  id: string;
  eventId: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  /** Milliseconds since the session started. */
  offsetMs: number;
}

export type PressSource = 'button' | 'surprise';

export interface MessageState {
  id: string;
  eventId: string;
  eventName: string;
  emoji: string;
  text: string;
  rarity: Rarity;
  source: PressSource;
}

export type ToastKind = 'rare' | 'achievement' | 'levelup';

export interface Toast {
  id: string;
  kind: ToastKind;
  emoji: string;
  title: string;
  body: string;
  /** Whether screen readers should announce it (rare events are already in the message live region). */
  announce: boolean;
}
