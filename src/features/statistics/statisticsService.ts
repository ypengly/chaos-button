import type {
  ChaosEventDefinition,
  LevelDefinition,
  LevelInfo,
  LifetimeStats,
  SessionStats,
} from '../../types';
import {
  getLocalStorage,
  getSessionStorage,
  isNonNegativeInt,
  isRecord,
  isStringArray,
  readJSON,
  removeItem,
  writeJSON,
  type ReadResult,
  type StorageLike,
} from '../../utils/storage';

export const LIFETIME_KEY = 'chaos-button:lifetime:v1';
export const SESSION_KEY = 'chaos-button:session:v1';

export const LEVELS: readonly LevelDefinition[] = [
  { level: 1, title: 'Curious', min: 1, max: 10, description: 'Just looking. Famous last words.' },
  { level: 2, title: 'Trouble Maker', min: 11, max: 25, description: 'You are getting ideas. Terrible ones.' },
  { level: 3, title: 'Chaos Agent', min: 26, max: 50, description: 'Officially a professional bad influence.' },
  { level: 4, title: 'Certified Menace', min: 51, max: 100, description: 'Local buttons fear your name.' },
  { level: 5, title: 'CHAOS LEGEND', min: 101, max: null, description: 'There is nothing left to teach you. Please go outside.' },
];

export const MAX_LEVEL = LEVELS[LEVELS.length - 1].level;

/** Level for a press count. Zero presses still counts as Level 1 (progress 0%). */
export function getLevelInfo(presses: number): LevelInfo {
  const safePresses = Math.max(0, Math.floor(presses));
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (safePresses >= level.min) current = level;
  }
  const next = LEVELS.find((level) => level.level === current.level + 1) ?? null;
  const pressesBefore = current.min - 1;
  const pressesIntoLevel = Math.max(0, safePresses - pressesBefore);
  const span = current.max === null ? null : current.max - pressesBefore;
  return {
    ...current,
    pressesIntoLevel,
    progress: span === null ? 1 : Math.min(1, pressesIntoLevel / span),
    pressesToNext: next ? Math.max(0, next.min - safePresses) : null,
    nextTitle: next ? next.title : null,
  };
}

export function createSession(now: number = Date.now()): SessionStats {
  return { startedAt: now, presses: 0, discoveredEventIds: [], rareEventIds: [] };
}

export function createLifetime(): LifetimeStats {
  return { totalPresses: 0, discoveredEventIds: [], rareEventIds: [], highestLevel: 0 };
}

function withId(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? [...ids] : [...ids, id];
}

/** Pure: returns new session stats after one press. Repeated events never double-count. */
export function applyPressToSession(session: SessionStats, event: ChaosEventDefinition): SessionStats {
  return {
    ...session,
    presses: session.presses + 1,
    discoveredEventIds: withId(session.discoveredEventIds, event.id),
    rareEventIds: event.rarity === 'rare' ? withId(session.rareEventIds, event.id) : [...session.rareEventIds],
  };
}

export function applyPressToLifetime(
  lifetime: LifetimeStats,
  event: ChaosEventDefinition,
  levelAfterPress: number,
): LifetimeStats {
  return {
    totalPresses: lifetime.totalPresses + 1,
    discoveredEventIds: withId(lifetime.discoveredEventIds, event.id),
    rareEventIds: event.rarity === 'rare' ? withId(lifetime.rareEventIds, event.id) : [...lifetime.rareEventIds],
    highestLevel: Math.max(lifetime.highestLevel, levelAfterPress),
  };
}

export function isLifetimePristine(lifetime: LifetimeStats): boolean {
  return (
    lifetime.totalPresses === 0 &&
    lifetime.discoveredEventIds.length === 0 &&
    lifetime.rareEventIds.length === 0 &&
    lifetime.highestLevel === 0
  );
}

export function parseSession(raw: unknown): SessionStats | null {
  if (!isRecord(raw)) return null;
  const { startedAt, presses, discoveredEventIds, rareEventIds } = raw;
  if (!isNonNegativeInt(startedAt) || !isNonNegativeInt(presses)) return null;
  if (!isStringArray(discoveredEventIds) || !isStringArray(rareEventIds)) return null;
  return {
    startedAt,
    presses,
    discoveredEventIds: [...new Set(discoveredEventIds)],
    rareEventIds: [...new Set(rareEventIds)],
  };
}

export function parseLifetime(raw: unknown): LifetimeStats | null {
  if (!isRecord(raw)) return null;
  const { totalPresses, discoveredEventIds, rareEventIds, highestLevel } = raw;
  if (!isNonNegativeInt(totalPresses) || !isNonNegativeInt(highestLevel)) return null;
  if (!isStringArray(discoveredEventIds) || !isStringArray(rareEventIds)) return null;
  return {
    totalPresses,
    discoveredEventIds: [...new Set(discoveredEventIds)],
    rareEventIds: [...new Set(rareEventIds)],
    highestLevel: Math.min(highestLevel, MAX_LEVEL),
  };
}

export function loadLifetime(storage: StorageLike | null = getLocalStorage()): ReadResult<LifetimeStats> {
  return readJSON(LIFETIME_KEY, parseLifetime, createLifetime, storage);
}

/** A pristine record is removed instead of stored, so "reset all" leaves nothing behind. */
export function saveLifetime(
  lifetime: LifetimeStats,
  storage: StorageLike | null = getLocalStorage(),
): boolean {
  if (isLifetimePristine(lifetime)) return removeItem(LIFETIME_KEY, storage);
  return writeJSON(LIFETIME_KEY, lifetime, storage);
}

export function loadSession(
  now: number = Date.now(),
  storage: StorageLike | null = getSessionStorage(),
): ReadResult<SessionStats> {
  return readJSON(SESSION_KEY, parseSession, () => createSession(now), storage);
}

export function saveSession(
  session: SessionStats,
  storage: StorageLike | null = getSessionStorage(),
): boolean {
  return writeJSON(SESSION_KEY, session, storage);
}

export function clearSession(storage: StorageLike | null = getSessionStorage()): boolean {
  return removeItem(SESSION_KEY, storage);
}
