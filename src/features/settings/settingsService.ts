import type { ButtonColor, EmojiTheme, Intensity, Settings, ThemeName } from '../../types';
import {
  getLocalStorage,
  isRecord,
  readJSON,
  writeJSON,
  type ReadResult,
  type StorageLike,
} from '../../utils/storage';

export const SETTINGS_KEY = 'chaos-button:settings:v1';

export const THEME_OPTIONS: ReadonlyArray<{ id: ThemeName; label: string; hint: string }> = [
  { id: 'light', label: 'Light', hint: 'Bright and colourful' },
  { id: 'dark', label: 'Dark', hint: 'Deep with vivid accents' },
  { id: 'chaos', label: 'Chaos', hint: 'Loud, warm and lively' },
];

export const BUTTON_COLOR_OPTIONS: ReadonlyArray<{ id: ButtonColor; label: string }> = [
  { id: 'violet', label: 'Violet' },
  { id: 'coral', label: 'Coral' },
  { id: 'blue', label: 'Electric blue' },
  { id: 'sunny', label: 'Sunny' },
  { id: 'pink', label: 'Pink' },
];

export const EMOJI_THEMES: Record<EmojiTheme, { label: string; emojis: readonly string[] }> = {
  party: { label: 'Party', emojis: ['🎉', '🎈', '🪩', '✨', '🥳', '🎊'] },
  food: { label: 'Snacks', emojis: ['🍕', '🍔', '🌮', '🍩', '🍟', '🧁'] },
  space: { label: 'Space', emojis: ['🚀', '🪐', '🌙', '⭐', '👽', '☄️'] },
  animals: { label: 'Critters', emojis: ['🐸', '🦄', '🐙', '🦆', '🐧', '🦖'] },
};

export const INTENSITY_OPTIONS: ReadonlyArray<{ id: Intensity; label: string; hint: string }> = [
  { id: 'reduced', label: 'Reduced', hint: 'Calm, fade-only effects' },
  { id: 'normal', label: 'Normal', hint: 'The intended experience' },
  { id: 'extra', label: 'Extra', hint: 'More particles, bigger shakes' },
];

const THEMES = THEME_OPTIONS.map((option) => option.id);
const BUTTON_COLORS = BUTTON_COLOR_OPTIONS.map((option) => option.id);
const EMOJI_THEME_IDS = Object.keys(EMOJI_THEMES) as EmojiTheme[];
const INTENSITIES = INTENSITY_OPTIONS.map((option) => option.id);

export function getDefaultSettings(prefersReducedMotion = false): Settings {
  return {
    theme: 'light',
    buttonColor: 'violet',
    emojiTheme: 'party',
    intensity: prefersReducedMotion ? 'reduced' : 'normal',
    soundEnabled: false,
    decorations: true,
  };
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/**
 * Validates stored settings. Unknown or invalid fields fall back to defaults
 * individually, so one bad value never wipes out everything else.
 * Returns null only when the stored value is not an object at all.
 */
export function parseSettings(raw: unknown, defaults: Settings = getDefaultSettings()): Settings | null {
  if (!isRecord(raw)) return null;
  return {
    theme: oneOf(raw.theme, THEMES, defaults.theme),
    buttonColor: oneOf(raw.buttonColor, BUTTON_COLORS, defaults.buttonColor),
    emojiTheme: oneOf(raw.emojiTheme, EMOJI_THEME_IDS, defaults.emojiTheme),
    intensity: oneOf(raw.intensity, INTENSITIES, defaults.intensity),
    // Sound is opt-in: anything other than a literal `true` means off.
    soundEnabled: raw.soundEnabled === true,
    decorations: typeof raw.decorations === 'boolean' ? raw.decorations : defaults.decorations,
  };
}

export function loadSettings(
  prefersReducedMotion = false,
  storage: StorageLike | null = getLocalStorage(),
): ReadResult<Settings> {
  const defaults = getDefaultSettings(prefersReducedMotion);
  return readJSON(SETTINGS_KEY, (raw) => parseSettings(raw, defaults), () => defaults, storage);
}

export function saveSettings(
  settings: Settings,
  storage: StorageLike | null = getLocalStorage(),
): boolean {
  return writeJSON(SETTINGS_KEY, settings, storage);
}
