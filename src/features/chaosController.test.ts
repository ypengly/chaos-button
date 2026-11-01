import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChaosController } from './chaos/chaosController';
import type { ActiveEffectSpec } from './chaos/eventTypes';

const spec = (eventId: string | null, count = 10, durationMs = 1000): ActiveEffectSpec => ({
  eventId,
  name: 'n',
  emoji: 'e',
  effects: [{ type: 'rain', count }],
  durationMs,
  seed: 1,
  density: 1,
  origin: { x: 0, y: 0 },
  emojiPool: ['x'],
  palette: null,
  giantEmoji: null,
});

describe('ChaosController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('removes an effect after its duration', () => {
    const controller = new ChaosController();
    controller.start(spec('a', 5, 1000));
    expect(controller.getSnapshot()).toHaveLength(1);
    vi.advanceTimersByTime(1001);
    expect(controller.getSnapshot()).toHaveLength(0);
  });

  it('replaces a repeated event instead of stacking it', () => {
    const controller = new ChaosController();
    controller.start(spec('a'));
    controller.start(spec('a'));
    expect(controller.getSnapshot()).toHaveLength(1);
  });

  it('caps the number of simultaneous effects', () => {
    const controller = new ChaosController({ maxActive: 2 });
    controller.start(spec('a'));
    controller.start(spec('b'));
    controller.start(spec('c'));
    expect(controller.getSnapshot().map((e) => e.eventId)).toEqual(['b', 'c']);
  });

  it('scales particles down when the budget is nearly spent', () => {
    const controller = new ChaosController({ particleBudget: 100, maxActive: 5 });
    controller.start(spec('a', 80));
    const second = controller.start(spec('b', 80));
    expect(second.particleScale).toBeCloseTo(0.25);
  });

  it('cancelAll clears timers and notifies subscribers', () => {
    const controller = new ChaosController();
    const listener = vi.fn();
    controller.subscribe(listener);
    controller.start(spec('a'));
    controller.cancelAll();
    expect(controller.getSnapshot()).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
    expect(listener).toHaveBeenCalled();
  });
});
