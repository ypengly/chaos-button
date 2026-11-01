import type { ActiveEffect, ActiveEffectSpec, EffectConfig } from './eventTypes';

export interface ControllerOptions {
  /** Maximum number of effects mounted at once. The oldest is cancelled first. */
  maxActive?: number;
  /** Maximum particles across all active effects combined. */
  particleBudget?: number;
  now?: () => number;
  setTimer?: (callback: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimer?: (handle: ReturnType<typeof setTimeout>) => void;
}

export const DEFAULT_MAX_ACTIVE = 4;
export const DEFAULT_PARTICLE_BUDGET = 150;
/** Extra time so exit animations can finish before the effect is removed from state. */
const CLEANUP_GRACE_MS = 0;

/** Raw particle count requested by a list of effect configs (before density scaling). */
export function countParticles(effects: readonly EffectConfig[]): number {
  let total = 0;
  for (const effect of effects) {
    if (
      effect.type === 'rain' ||
      effect.type === 'burst' ||
      effect.type === 'sparkles' ||
      effect.type === 'stars'
    ) {
      total += effect.count;
    }
  }
  return total;
}

function scaledParticles(effect: Pick<ActiveEffect, 'effects' | 'density'> & { particleScale?: number }): number {
  return countParticles(effect.effects) * effect.density * (effect.particleScale ?? 1);
}

/**
 * Shared coordinator for visual effects. It owns every timer, so effects can be
 * cancelled safely (page hidden, session reset, unmount) without leaking.
 * Implements the subscribe/getSnapshot contract of useSyncExternalStore.
 */
export class ChaosController {
  private active: readonly ActiveEffect[] = [];
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly listeners = new Set<() => void>();
  private counter = 0;

  private readonly maxActive: number;
  private readonly particleBudget: number;
  private readonly now: () => number;
  private readonly setTimer: NonNullable<ControllerOptions['setTimer']>;
  private readonly clearTimer: NonNullable<ControllerOptions['clearTimer']>;

  constructor(options: ControllerOptions = {}) {
    this.maxActive = Math.max(1, options.maxActive ?? DEFAULT_MAX_ACTIVE);
    this.particleBudget = Math.max(0, options.particleBudget ?? DEFAULT_PARTICLE_BUDGET);
    this.now = options.now ?? Date.now;
    this.setTimer = options.setTimer ?? ((callback, ms) => setTimeout(callback, ms));
    this.clearTimer = options.clearTimer ?? ((handle) => clearTimeout(handle));
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): readonly ActiveEffect[] => this.active;

  start(spec: ActiveEffectSpec): ActiveEffect {
    // Re-triggering an event replaces its previous instance instead of stacking copies.
    if (spec.eventId !== null) {
      for (const existing of this.active) {
        if (existing.eventId === spec.eventId) this.removeInternal(existing.id);
      }
    }

    // Make room: cancel the oldest effects while at capacity.
    while (this.active.length >= this.maxActive) {
      this.removeInternal(this.active[0].id);
    }

    const used = this.active.reduce((sum, effect) => sum + scaledParticles(effect), 0);
    const requested = scaledParticles(spec);
    const remaining = Math.max(0, this.particleBudget - used);
    const particleScale = requested <= 0 ? 1 : Math.min(1, remaining / requested);

    this.counter += 1;
    const effect: ActiveEffect = {
      ...spec,
      id: `fx-${this.counter}`,
      startedAt: this.now(),
      particleScale,
    };

    this.active = [...this.active, effect];
    this.timers.set(
      effect.id,
      this.setTimer(() => this.cancel(effect.id), effect.durationMs + CLEANUP_GRACE_MS),
    );
    this.emit();
    return effect;
  }

  cancel(id: string): void {
    if (this.removeInternal(id)) this.emit();
  }

  cancelAll(): void {
    if (this.active.length === 0 && this.timers.size === 0) return;
    for (const handle of this.timers.values()) this.clearTimer(handle);
    this.timers.clear();
    this.active = [];
    this.emit();
  }

  /** Clears timers and effects. Safe to call more than once; the controller stays reusable. */
  dispose(): void {
    this.cancelAll();
  }

  private removeInternal(id: string): boolean {
    const handle = this.timers.get(id);
    if (handle !== undefined) {
      this.clearTimer(handle);
      this.timers.delete(id);
    }
    const next = this.active.filter((effect) => effect.id !== id);
    if (next.length === this.active.length) return false;
    this.active = next;
    return true;
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}
