import { describe, expect, it } from 'vitest';
import { loadAchievements, saveAchievements, ACHIEVEMENTS_KEY } from './achievements/achievementService';
import { eraseAllProgressFromStorage } from './chaos/chaosState';
import {
  getDefaultSettings,
  loadSettings,
  parseSettings,
  saveSettings,
  SETTINGS_KEY,
} from './settings/settingsService';
import {
  LIFETIME_KEY,
  SESSION_KEY,
  createLifetime,
  loadLifetime,
  loadSession,
  saveLifetime,
  saveSession,
  createSession,
} from './statistics/statisticsService';
import type { StorageLike } from '../utils/storage';

describe('settings persistence', () => {
  it('defaults to sound off', () => {
    expect(getDefaultSettings().soundEnabled).toBe(false);
  });

  it('uses reduced intensity by default when the OS prefers reduced motion', () => {
    expect(getDefaultSettings(true).intensity).toBe('reduced');
  });

  it('round-trips through localStorage', () => {
    const settings = { ...getDefaultSettings(), theme: 'chaos' as const, soundEnabled: true, intensity: 'extra' as const };
    saveSettings(settings);
    expect(loadSettings()).toEqual({ value: settings, status: 'ok' });
  });

  it('falls back to defaults on invalid JSON', () => {
    localStorage.setItem(SETTINGS_KEY, '{not json');
    const result = loadSettings();
    expect(result.status).toBe('corrupt');
    expect(result.value).toEqual(getDefaultSettings());
  });

  it('repairs individual invalid fields and never trusts truthy sound values', () => {
    const parsed = parseSettings({ theme: 'neon', intensity: 'extra', soundEnabled: 'yes' });
    expect(parsed?.theme).toBe('light');
    expect(parsed?.intensity).toBe('extra');
    expect(parsed?.soundEnabled).toBe(false);
  });

  it('rejects non-object values', () => {
    localStorage.setItem(SETTINGS_KEY, '42');
    expect(loadSettings().status).toBe('corrupt');
  });
});

describe('statistics persistence', () => {
  it('saves and restores lifetime stats', () => {
    const lifetime = { totalPresses: 7, discoveredEventIds: ['a', 'b'], rareEventIds: ['b'], highestLevel: 1 };
    saveLifetime(lifetime);
    expect(loadLifetime().value).toEqual(lifetime);
  });

  it('falls back to safe defaults for corrupt or invalid stats', () => {
    localStorage.setItem(LIFETIME_KEY, 'oops');
    expect(loadLifetime()).toEqual({ value: createLifetime(), status: 'corrupt' });
    localStorage.setItem(LIFETIME_KEY, JSON.stringify({ totalPresses: -5 }));
    expect(loadLifetime().status).toBe('corrupt');
  });

  it('reports missing data without treating it as an error', () => {
    expect(loadLifetime().status).toBe('missing');
  });

  it('stores the session in sessionStorage, not localStorage', () => {
    saveSession({ ...createSession(5), presses: 3 });
    expect(sessionStorage.getItem(SESSION_KEY)).not.toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(loadSession(0).value.presses).toBe(3);
  });

  it('session data does not survive a new browser session', () => {
    saveLifetime({ ...createLifetime(), totalPresses: 4 });
    sessionStorage.clear();
    expect(loadSession(123).value.presses).toBe(0);
    expect(loadLifetime().value.totalPresses).toBe(4);
  });
});

describe('storage failures', () => {
  const throwing: StorageLike = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
    removeItem: () => {
      throw new Error('blocked');
    },
  };

  it('does not throw when storage is unavailable', () => {
    expect(loadSettings(false, throwing).status).toBe('unavailable');
    expect(saveSettings(getDefaultSettings(), throwing)).toBe(false);
    expect(loadSettings(false, null).value).toEqual(getDefaultSettings());
  });
});

describe('reset all', () => {
  it('removes saved progress and leaves settings untouched', () => {
    saveSettings({ ...getDefaultSettings(), theme: 'dark' });
    saveLifetime({ ...createLifetime(), totalPresses: 9 });
    saveAchievements({ 'first-contact': 'now' });
    saveSession({ ...createSession(1), presses: 2 });

    eraseAllProgressFromStorage();

    expect(localStorage.getItem(LIFETIME_KEY)).toBeNull();
    expect(localStorage.getItem(ACHIEVEMENTS_KEY)).toBeNull();
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    expect(loadSettings().value.theme).toBe('dark');
    expect(loadAchievements().value).toEqual({});
  });
});
