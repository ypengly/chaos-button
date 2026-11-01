import type { AchievementDefinition, AchievementRecord, LifetimeStats } from '../../types';
import {
  getLocalStorage,
  isRecord,
  readJSON,
  removeItem,
  writeJSON,
  type ReadResult,
  type StorageLike,
} from '../../utils/storage';
import { achievementDefinitions } from './achievementDefinitions';

export const ACHIEVEMENTS_KEY = 'chaos-button:achievements:v1';

export interface AchievementProgress {
  definition: AchievementDefinition;
  current: number;
  target: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface EvaluationResult {
  record: AchievementRecord;
  newlyUnlocked: AchievementDefinition[];
}

export function getProgressValue(definition: AchievementDefinition, lifetime: LifetimeStats): number {
  return Math.min(definition.target, Math.max(0, definition.progress(lifetime)));
}

/**
 * Pure: unlocks every achievement whose target is met. Existing unlocks keep their
 * original timestamp, and unlocks are never revoked.
 */
export function evaluateAchievements(
  lifetime: LifetimeStats,
  existing: AchievementRecord,
  unlockedAt: string,
  definitions: readonly AchievementDefinition[] = achievementDefinitions,
): EvaluationResult {
  const record: AchievementRecord = { ...existing };
  const newlyUnlocked: AchievementDefinition[] = [];
  for (const definition of definitions) {
    if (record[definition.id]) continue;
    if (definition.progress(lifetime) >= definition.target) {
      record[definition.id] = unlockedAt;
      newlyUnlocked.push(definition);
    }
  }
  return { record, newlyUnlocked };
}

export function getAchievementProgress(
  lifetime: LifetimeStats,
  record: AchievementRecord,
  definitions: readonly AchievementDefinition[] = achievementDefinitions,
): AchievementProgress[] {
  return definitions.map((definition) => {
    const unlockedAt = record[definition.id] ?? null;
    return {
      definition,
      current: unlockedAt ? definition.target : getProgressValue(definition, lifetime),
      target: definition.target,
      unlocked: unlockedAt !== null,
      unlockedAt,
    };
  });
}

export function parseAchievements(
  raw: unknown,
  definitions: readonly AchievementDefinition[] = achievementDefinitions,
): AchievementRecord | null {
  if (!isRecord(raw)) return null;
  const known = new Set(definitions.map((definition) => definition.id));
  const record: AchievementRecord = {};
  for (const [id, value] of Object.entries(raw)) {
    if (known.has(id) && typeof value === 'string') record[id] = value;
  }
  return record;
}

export function loadAchievements(
  storage: StorageLike | null = getLocalStorage(),
): ReadResult<AchievementRecord> {
  return readJSON(ACHIEVEMENTS_KEY, (raw) => parseAchievements(raw), () => ({}), storage);
}

export function saveAchievements(
  record: AchievementRecord,
  storage: StorageLike | null = getLocalStorage(),
): boolean {
  if (Object.keys(record).length === 0) return removeItem(ACHIEVEMENTS_KEY, storage);
  return writeJSON(ACHIEVEMENTS_KEY, record, storage);
}
