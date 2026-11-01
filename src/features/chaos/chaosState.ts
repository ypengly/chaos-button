import type {
  AchievementRecord,
  ChaosEventDefinition,
  FeedEntry,
  LifetimeStats,
  MessageState,
  PressSource,
  SessionStats,
  Toast,
} from '../../types';
import {
  evaluateAchievements,
  loadAchievements,
  saveAchievements,
} from '../achievements/achievementService';
import {
  applyPressToLifetime,
  applyPressToSession,
  clearSession,
  createLifetime,
  createSession,
  getLevelInfo,
  loadLifetime,
  loadSession,
  saveLifetime,
  saveSession,
} from '../statistics/statisticsService';
import type { ReadStatus } from '../../utils/storage';

export const MAX_FEED_ENTRIES = 20;
export const MAX_TOASTS = 4;

export interface PressOutcome {
  eventId: string;
  level: number;
  leveledUp: boolean;
  newAchievementIds: string[];
  isRare: boolean;
  isNewDiscovery: boolean;
}

export interface ChaosState {
  session: SessionStats;
  lifetime: LifetimeStats;
  achievements: AchievementRecord;
  feed: FeedEntry[];
  message: MessageState | null;
  toasts: Toast[];
  /** Increments on every level-up so the UI can replay a celebration. */
  levelUpSignal: number;
  lastPress: PressOutcome | null;
}

export type ChaosAction =
  | {
      type: 'PRESS';
      event: ChaosEventDefinition;
      message: string;
      at: number;
      entryId: string;
      source: PressSource;
    }
  | { type: 'CLEAR_FEED' }
  | { type: 'RESET_SESSION'; at: number }
  | { type: 'RESET_ALL'; at: number }
  | { type: 'DISMISS_TOAST'; id: string };

export function createInitialState(now: number): ChaosState {
  return {
    session: createSession(now),
    lifetime: createLifetime(),
    achievements: {},
    feed: [],
    message: null,
    toasts: [],
    levelUpSignal: 0,
    lastPress: null,
  };
}

/** Pure reducer: all randomness is decided by the caller and passed in the action. */
export function chaosReducer(state: ChaosState, action: ChaosAction): ChaosState {
  switch (action.type) {
    case 'PRESS': {
      const { event, message, at, entryId, source } = action;
      const levelBefore = getLevelInfo(state.session.presses).level;
      const isNewDiscovery = !state.session.discoveredEventIds.includes(event.id);

      const session = applyPressToSession(state.session, event);
      const level = getLevelInfo(session.presses);
      const leveledUp = session.presses > 0 && level.level > levelBefore;

      const lifetime = applyPressToLifetime(state.lifetime, event, level.level);
      const evaluation = evaluateAchievements(lifetime, state.achievements, new Date(at).toISOString());

      const entry: FeedEntry = {
        id: entryId,
        eventId: event.id,
        name: event.name,
        emoji: event.emoji,
        rarity: event.rarity,
        offsetMs: Math.max(0, at - session.startedAt),
      };

      const newToasts: Toast[] = [];
      if (event.rarity === 'rare') {
        newToasts.push({
          id: `${entryId}:rare`,
          kind: 'rare',
          emoji: event.emoji,
          title: 'Rare event!',
          body: `${event.name} just happened.`,
          announce: false,
        });
      }
      if (leveledUp) {
        newToasts.push({
          id: `${entryId}:level`,
          kind: 'levelup',
          emoji: '🏆',
          title: `Level ${level.level}: ${level.title}`,
          body: level.description,
          announce: true,
        });
      }
      for (const achievement of evaluation.newlyUnlocked) {
        newToasts.push({
          id: `${entryId}:ach:${achievement.id}`,
          kind: 'achievement',
          emoji: achievement.emoji,
          title: `Badge unlocked: ${achievement.name}`,
          body: achievement.description,
          announce: true,
        });
      }

      return {
        session,
        lifetime,
        achievements: evaluation.record,
        feed: [entry, ...state.feed].slice(0, MAX_FEED_ENTRIES),
        message: {
          id: entryId,
          eventId: event.id,
          eventName: event.name,
          emoji: event.emoji,
          text: message,
          rarity: event.rarity,
          source,
        },
        toasts: [...state.toasts, ...newToasts].slice(-MAX_TOASTS),
        levelUpSignal: leveledUp ? state.levelUpSignal + 1 : state.levelUpSignal,
        lastPress: {
          eventId: event.id,
          level: level.level,
          leveledUp,
          newAchievementIds: evaluation.newlyUnlocked.map((achievement) => achievement.id),
          isRare: event.rarity === 'rare',
          isNewDiscovery,
        },
      };
    }

    case 'CLEAR_FEED':
      return { ...state, feed: [] };

    case 'DISMISS_TOAST':
      return { ...state, toasts: state.toasts.filter((toast) => toast.id !== action.id) };

    /** Starts a fresh session. Lifetime statistics and achievements are deliberately untouched. */
    case 'RESET_SESSION':
      return {
        ...state,
        session: createSession(action.at),
        feed: [],
        message: null,
        toasts: [],
        lastPress: null,
      };

    /** Erases the session, lifetime statistics and achievements. Settings are kept. */
    case 'RESET_ALL':
      return {
        ...createInitialState(action.at),
        levelUpSignal: state.levelUpSignal,
      };

    default:
      return state;
  }
}

export interface LoadedState {
  state: ChaosState;
  /** Read statuses so the UI can warn about corrupt or unavailable storage. */
  statuses: ReadStatus[];
}

export function loadInitialState(now: number): LoadedState {
  const session = loadSession(now);
  const lifetime = loadLifetime();
  const achievements = loadAchievements();
  return {
    state: {
      ...createInitialState(now),
      session: session.value,
      lifetime: lifetime.value,
      achievements: achievements.value,
    },
    statuses: [session.status, lifetime.status, achievements.status],
  };
}

/** Writes whichever slices changed. Pristine data is removed rather than stored. */
export function persistChange(previous: ChaosState, next: ChaosState): void {
  if (previous.session !== next.session) saveSession(next.session);
  if (previous.lifetime !== next.lifetime) saveLifetime(next.lifetime);
  if (previous.achievements !== next.achievements) saveAchievements(next.achievements);
}

/** Removes every key this app owns from browser storage (used by "reset all"). */
export function eraseAllProgressFromStorage(): void {
  clearSession();
  saveLifetime(createLifetime());
  saveAchievements({});
}
