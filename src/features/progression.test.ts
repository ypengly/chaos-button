import { describe, expect, it } from 'vitest';
import { evaluateAchievements, getAchievementProgress } from './achievements/achievementService';
import { chaosEvents } from './chaos/chaosEvents';
import { chaosReducer, createInitialState } from './chaos/chaosState';
import {
  applyPressToLifetime,
  applyPressToSession,
  createLifetime,
  createSession,
  getLevelInfo,
} from './statistics/statisticsService';

const standard = chaosEvents.filter((e) => e.rarity === 'standard');
const rare = chaosEvents.find((e) => e.rarity === 'rare')!;

describe('levels', () => {
  it.each([
    [0, 1],
    [1, 1],
    [10, 1],
    [11, 2],
    [25, 2],
    [26, 3],
    [50, 3],
    [51, 4],
    [100, 4],
    [101, 5],
    [5000, 5],
  ])('%i presses is level %i', (presses, level) => {
    expect(getLevelInfo(presses).level).toBe(level);
  });

  it('reports progress and presses to next level', () => {
    const info = getLevelInfo(5);
    expect(info.progress).toBeCloseTo(0.5);
    expect(info.pressesToNext).toBe(6);
    expect(getLevelInfo(101).pressesToNext).toBeNull();
    expect(getLevelInfo(101).progress).toBe(1);
  });
});

describe('statistics', () => {
  it('increments presses and does not double count events', () => {
    let session = createSession(0);
    session = applyPressToSession(session, standard[0]);
    session = applyPressToSession(session, standard[0]);
    expect(session.presses).toBe(2);
    expect(session.discoveredEventIds).toEqual([standard[0].id]);
    expect(session.rareEventIds).toEqual([]);
  });

  it('tracks rare discoveries separately', () => {
    const lifetime = applyPressToLifetime(createLifetime(), rare, 1);
    expect(lifetime.rareEventIds).toEqual([rare.id]);
    expect(applyPressToLifetime(lifetime, rare, 1).rareEventIds).toEqual([rare.id]);
  });
});

describe('achievements', () => {
  const unlockedIds = (lifetime: ReturnType<typeof createLifetime>) =>
    Object.keys(evaluateAchievements(lifetime, {}, 'now').record);

  it('unlocks First Contact on the first press', () => {
    expect(unlockedIds(createLifetime())).toEqual([]);
    expect(unlockedIds({ ...createLifetime(), totalPresses: 1 })).toContain('first-contact');
  });

  it('unlocks Button Addict at exactly 25 presses', () => {
    expect(unlockedIds({ ...createLifetime(), totalPresses: 24 })).not.toContain('button-addict');
    expect(unlockedIds({ ...createLifetime(), totalPresses: 25 })).toContain('button-addict');
  });

  it('only unlocks Rare Collector after a rare event', () => {
    const many = { ...createLifetime(), totalPresses: 30, discoveredEventIds: standard.map((e) => e.id) };
    expect(unlockedIds(many)).not.toContain('rare-collector');
    expect(unlockedIds({ ...many, rareEventIds: [rare.id] })).toContain('rare-collector');
  });

  it('unlocks Everything Is Broken at 10 distinct events', () => {
    const ids = standard.map((e) => e.id);
    expect(unlockedIds({ ...createLifetime(), discoveredEventIds: ids.slice(0, 9) })).not.toContain(
      'everything-is-broken',
    );
    expect(unlockedIds({ ...createLifetime(), discoveredEventIds: ids.slice(0, 10) })).toContain(
      'everything-is-broken',
    );
  });

  it('unlocks Chaos Legend at level 5', () => {
    expect(unlockedIds({ ...createLifetime(), highestLevel: 4 })).not.toContain('chaos-legend');
    expect(unlockedIds({ ...createLifetime(), highestLevel: 5 })).toContain('chaos-legend');
  });

  it('keeps original timestamps and reports newly unlocked only once', () => {
    const lifetime = { ...createLifetime(), totalPresses: 1 };
    const first = evaluateAchievements(lifetime, {}, 't1');
    expect(first.newlyUnlocked.map((a) => a.id)).toEqual(['first-contact']);
    const second = evaluateAchievements(lifetime, first.record, 't2');
    expect(second.newlyUnlocked).toEqual([]);
    expect(second.record['first-contact']).toBe('t1');
  });

  it('reports progress for locked achievements', () => {
    const progress = getAchievementProgress({ ...createLifetime(), totalPresses: 10 }, {});
    const addict = progress.find((p) => p.definition.id === 'button-addict')!;
    expect(addict.current).toBe(10);
    expect(addict.target).toBe(25);
    expect(addict.unlocked).toBe(false);
  });
});

describe('reducer', () => {
  const press = (state: ReturnType<typeof createInitialState>, i: number, event = standard[i % standard.length]) =>
    chaosReducer(state, { type: 'PRESS', event, message: 'm', at: 1000 + i, entryId: `e${i}`, source: 'button' });

  it('levels up exactly at the boundary and queues a toast', () => {
    let state = createInitialState(0);
    for (let i = 0; i < 10; i += 1) state = press(state, i);
    expect(state.lastPress?.leveledUp).toBe(false);
    state = press(state, 10);
    expect(state.lastPress?.leveledUp).toBe(true);
    expect(state.levelUpSignal).toBe(1);
    expect(state.toasts.some((t) => t.kind === 'levelup')).toBe(true);
  });

  it('caps the feed length and keeps newest first', () => {
    let state = createInitialState(0);
    for (let i = 0; i < 30; i += 1) state = press(state, i);
    expect(state.feed).toHaveLength(20);
    expect(state.feed[0].id).toBe('e29');
  });

  it('shows a rare notification for rare events', () => {
    const state = press(createInitialState(0), 0, rare);
    expect(state.toasts.some((t) => t.kind === 'rare')).toBe(true);
  });

  it('session reset keeps lifetime stats and achievements', () => {
    let state = createInitialState(0);
    for (let i = 0; i < 3; i += 1) state = press(state, i);
    const reset = chaosReducer(state, { type: 'RESET_SESSION', at: 5000 });
    expect(reset.session.presses).toBe(0);
    expect(reset.feed).toEqual([]);
    expect(reset.lifetime.totalPresses).toBe(3);
    expect(reset.achievements['first-contact']).toBeDefined();
  });

  it('reset all clears everything', () => {
    let state = createInitialState(0);
    for (let i = 0; i < 3; i += 1) state = press(state, i);
    const reset = chaosReducer(state, { type: 'RESET_ALL', at: 5000 });
    expect(reset.lifetime).toEqual(createLifetime());
    expect(reset.achievements).toEqual({});
    expect(reset.session.presses).toBe(0);
  });
});
