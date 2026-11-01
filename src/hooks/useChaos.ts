import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { pickEvent } from '../features/chaos/chaosEngine';
import { ChaosController } from '../features/chaos/chaosController';
import {
  chaosReducer,
  eraseAllProgressFromStorage,
  loadInitialState,
  persistChange,
  type ChaosAction,
  type ChaosState,
} from '../features/chaos/chaosState';
import { buildEffectSpec, buildLevelUpSpec, computeDensity } from '../features/chaos/effectFactory';
import { registry } from '../features/chaos/eventRegistry';
import { pickMessage } from '../features/chaos/messages';
import { EMOJI_THEMES } from '../features/settings/settingsService';
import type { EmojiTheme, Intensity, Point, PressSource, SoundKind } from '../types';
import type { Rng } from '../utils/random';
import type { ReadStatus } from '../utils/storage';

export type ButtonMode = 'idle' | 'activated' | 'rare';

/** How long the button shows its "just pressed" label. */
const ACTIVATED_MS = 900;
const RARE_LABEL_MS = 1800;

export interface UseChaosOptions {
  intensity: Intensity;
  emojiTheme: EmojiTheme;
  /** Where particles should originate (the centre of the main button). */
  getOrigin: () => Point;
  playSound?: (kind: SoundKind) => void;
  /** Injectable for deterministic tests. */
  rng?: Rng;
  now?: () => number;
}

export function useChaos(options: UseChaosOptions) {
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const [controller] = useState(() => new ChaosController());
  const [loaded] = useState(() => loadInitialState((options.now ?? Date.now)()));
  const [state, setState] = useState<ChaosState>(loaded.state);
  const stateRef = useRef(state);
  const [buttonMode, setButtonMode] = useState<ButtonMode>('idle');

  const lastEventIdRef = useRef<string | null>(null);
  const lastMessageRef = useRef<string | null>(null);
  const counterRef = useRef(0);
  const modeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeEffects = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);

  /** Applies an action synchronously so rapid presses never read stale state. */
  const commit = useCallback((action: ChaosAction): ChaosState => {
    const previous = stateRef.current;
    const next = chaosReducer(previous, action);
    stateRef.current = next;
    setState(next);
    persistChange(previous, next);
    return next;
  }, []);

  const flashButton = useCallback((mode: ButtonMode, ms: number) => {
    if (modeTimerRef.current) clearTimeout(modeTimerRef.current);
    setButtonMode(mode);
    modeTimerRef.current = setTimeout(() => {
      modeTimerRef.current = null;
      setButtonMode('idle');
    }, ms);
  }, []);

  const trigger = useCallback(
    (source: PressSource = 'button') => {
      const current = optionsRef.current;
      const rng = current.rng ?? Math.random;
      const now = current.now ?? Date.now;

      const event = pickEvent(registry.events, { previousId: lastEventIdRef.current, rng });
      const message = pickMessage(event, lastMessageRef.current, rng);
      lastEventIdRef.current = event.id;
      lastMessageRef.current = message;

      const at = now();
      counterRef.current += 1;
      const entryId = `${at}-${counterRef.current}`;

      const next = commit({ type: 'PRESS', event, message, at, entryId, source });

      const context = {
        rng,
        density: computeDensity(current.intensity, typeof window === 'undefined' ? 1024 : window.innerWidth),
        origin: current.getOrigin(),
        emojiPool: EMOJI_THEMES[current.emojiTheme].emojis,
      };
      controller.start(buildEffectSpec(event, context));

      const outcome = next.lastPress;
      if (outcome?.leveledUp) controller.start(buildLevelUpSpec(context));

      if (current.playSound) {
        if (event.sound === 'supreme') current.playSound('supreme');
        else if (outcome?.leveledUp) current.playSound('levelup');
        else if (outcome && outcome.newAchievementIds.length > 0) current.playSound('achievement');
        else current.playSound(event.rarity === 'rare' ? 'rare' : 'press');
      }

      if (event.rarity === 'rare') flashButton('rare', RARE_LABEL_MS);
      else flashButton('activated', ACTIVATED_MS);

      return event;
    },
    [commit, controller, flashButton],
  );

  const clearFeed = useCallback(() => {
    commit({ type: 'CLEAR_FEED' });
  }, [commit]);

  const dismissToast = useCallback(
    (id: string) => {
      commit({ type: 'DISMISS_TOAST', id });
    },
    [commit],
  );

  const resetSession = useCallback(() => {
    controller.cancelAll();
    lastEventIdRef.current = null;
    lastMessageRef.current = null;
    commit({ type: 'RESET_SESSION', at: (optionsRef.current.now ?? Date.now)() });
  }, [commit, controller]);

  const resetAll = useCallback(() => {
    controller.cancelAll();
    lastEventIdRef.current = null;
    lastMessageRef.current = null;
    commit({ type: 'RESET_ALL', at: (optionsRef.current.now ?? Date.now)() });
    eraseAllProgressFromStorage();
  }, [commit, controller]);

  // Cancel running effects when the tab is hidden so nothing piles up in the background.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') controller.cancelAll();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [controller]);

  // Clean up every timer on unmount.
  useEffect(() => {
    return () => {
      controller.dispose();
      if (modeTimerRef.current) {
        clearTimeout(modeTimerRef.current);
        modeTimerRef.current = null;
      }
    };
  }, [controller]);

  const storageStatuses: ReadStatus[] = loaded.statuses;

  return {
    state,
    activeEffects,
    buttonMode,
    storageStatuses,
    trigger,
    clearFeed,
    dismissToast,
    resetSession,
    resetAll,
  };
}
