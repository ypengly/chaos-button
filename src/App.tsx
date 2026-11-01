import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { MotionConfig, motion } from 'framer-motion';
import { AboutSection } from './components/AboutSection';
import { AchievementGrid } from './components/AchievementGrid';
import { ChaosLevel } from './components/ChaosLevel';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Decorations } from './components/Decorations';
import { EffectsLayer } from './components/EffectsLayer';
import { EventFeed } from './components/EventFeed';
import { EventNotification } from './components/EventNotification';
import { Footer, type ResetKind } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { SettingsPanel } from './components/SettingsPanel';
import { StatsPanel } from './components/StatsPanel';
import { StorageNotice } from './components/StorageNotice';
import { getAchievementProgress } from './features/achievements/achievementService';
import { registry } from './features/chaos/eventRegistry';
import {
  getDefaultSettings,
  parseSettings,
  SETTINGS_KEY,
} from './features/settings/settingsService';
import { getLevelInfo } from './features/statistics/statisticsService';
import { useChaos } from './hooks/useChaos';
import { useLocalStorage } from './hooks/useLocalStorage';
import { usePageVisible } from './hooks/usePageVisibility';
import { prefersReducedMotionNow, useReducedMotion } from './hooks/useReducedMotion';
import { useSound } from './hooks/useSound';
import type { Point, Settings } from './types';
import type { Rng } from './utils/random';

export interface AppProps {
  /** Injectable random source so tests can force specific events. */
  rng?: Rng;
}

const RESET_COPY: Record<ResetKind, { title: string; description: string; confirmLabel: string }> = {
  session: {
    title: 'Start a fresh session?',
    description:
      "This clears this session's presses, level progress and event feed. Your badges and lifetime statistics are kept.",
    confirmLabel: 'Reset session',
  },
  all: {
    title: 'Erase all saved progress?',
    description:
      'This permanently deletes the lifetime statistics and badges saved in this browser, and starts a new session. Your theme and other settings are kept. This cannot be undone.',
    confirmLabel: 'Erase everything',
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function App({ rng }: AppProps) {
  const osReduced = useReducedMotion();
  const pageVisible = usePageVisible();

  const [settings, setSettings, settingsStatus] = useLocalStorage<Settings>(
    SETTINGS_KEY,
    () => getDefaultSettings(prefersReducedMotionNow()),
    (raw) => parseSettings(raw, getDefaultSettings(prefersReducedMotionNow())),
  );

  // The operating-system preference always wins over the in-app setting and the Chaos theme.
  const intensity = osReduced ? 'reduced' : settings.intensity;
  const reduced = intensity === 'reduced';

  const sound = useSound(settings.soundEnabled);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pendingReset, setPendingReset] = useState<ResetKind | null>(null);

  const getOrigin = useCallback((): Point => {
    const element = buttonRef.current;
    if (!element) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const rect = element.getBoundingClientRect();
    return {
      x: clamp(rect.left + rect.width / 2, 0, window.innerWidth),
      y: clamp(rect.top + rect.height / 2, 0, window.innerHeight * 0.9),
    };
  }, []);

  const chaos = useChaos({
    intensity,
    emojiTheme: settings.emojiTheme,
    getOrigin,
    playSound: sound.play,
    rng,
  });
  const { state, activeEffects } = chaos;

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  const handleSettingsChange = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((previous) => ({ ...previous, ...patch }));
      // Turning sound on is a user gesture, so a short confirmation blip is allowed here.
      if (patch.soundEnabled === true) sound.preview('toggle');
    },
    [setSettings, sound],
  );

  // Class-token effects and the colour palette are applied on the root element.
  const fxTokens = new Set<string>();
  const rootStyle: Record<string, string | number> = { '--fx-amp': intensity === 'extra' ? 1.8 : 1 };
  for (const effect of activeEffects) {
    for (const config of effect.effects) {
      if (config.type !== 'class') continue;
      // In reduced motion only colour-only tokens (The Void) are applied.
      if (reduced && config.token !== 'void') continue;
      fxTokens.add(config.token);
      rootStyle[`--fx-${config.token}-ms`] = `${effect.durationMs}ms`;
    }
  }
  const paletteEffect = [...activeEffects].reverse().find((effect) => effect.palette !== null);
  if (paletteEffect?.palette) {
    const { palette } = paletteEffect;
    rootStyle['--accent'] = palette.accent;
    rootStyle['--accent-2'] = palette.accent2;
    rootStyle['--btn-from'] = palette.btnFrom;
    rootStyle['--btn-to'] = palette.btnTo;
    rootStyle['--btn-glow'] = palette.glow;
  }

  const level = getLevelInfo(state.session.presses);
  const achievementItems = getAchievementProgress(state.lifetime, state.achievements);
  const storageStatuses = [...chaos.storageStatuses, settingsStatus];

  const confirmReset = () => {
    if (pendingReset === 'session') chaos.resetSession();
    if (pendingReset === 'all') chaos.resetAll();
    setPendingReset(null);
  };

  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'user'}>
      <div
        className="app-root"
        data-theme={settings.theme}
        data-button={settings.buttonColor}
        data-motion={reduced ? 'reduced' : 'full'}
        data-intensity={intensity}
        data-hidden={!pageVisible}
        data-fx={[...fxTokens].join(' ')}
        style={rootStyle as CSSProperties}
      >
        <a
          href="#main"
          className="sr-only-focusable z-[70] rounded-full bg-accent px-4 py-2 font-bold text-on-accent focus:fixed focus:left-3 focus:top-3"
        >
          Skip to content
        </a>

        {settings.decorations ? <Decorations /> : null}

        {paletteEffect?.palette ? (
          <motion.div
            key={paletteEffect.id}
            aria-hidden="true"
            className="palette-wash"
            style={{
              background: `linear-gradient(135deg, ${paletteEffect.palette.tint[0]}, ${paletteEffect.palette.tint[1]})`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: paletteEffect.durationMs / 1000, times: [0, 0.1, 0.85, 1] }}
          />
        ) : null}

        <Header
          theme={settings.theme}
          soundEnabled={settings.soundEnabled}
          onThemeChange={(theme) => handleSettingsChange({ theme })}
          onSoundChange={(soundEnabled) => handleSettingsChange({ soundEnabled })}
        />

        <main id="main" className="fx-shake relative z-10 mx-auto max-w-6xl pb-4">
          <StorageNotice statuses={storageStatuses} />

          <Hero
            ref={buttonRef}
            mode={chaos.buttonMode}
            message={state.message}
            activeEffects={activeEffects}
            reduced={reduced}
            disabled={pendingReset !== null}
            onPress={() => chaos.trigger('button')}
            onSurprise={() => chaos.trigger('surprise')}
          />

          <div className="mt-6 space-y-4 px-4">
            <StatsPanel
              session={state.session}
              lifetime={state.lifetime}
              levelNumber={level.level}
              levelTitle={level.title}
              totalEvents={registry.events.length}
              totalRareEvents={registry.rareEvents.length}
            />
            <ChaosLevel level={level} presses={state.session.presses} levelUpSignal={state.levelUpSignal} />
          </div>

          <div className="mt-6 grid gap-4 px-4 lg:grid-cols-2">
            <EventFeed entries={state.feed} onClear={chaos.clearFeed} />
            <SettingsPanel settings={settings} onChange={handleSettingsChange} osReducedMotion={osReduced} />
          </div>

          <div className="mt-14">
            <AchievementGrid items={achievementItems} />
          </div>

          <div className="mt-14">
            <AboutSection />
          </div>
        </main>

        <Footer onRequestReset={setPendingReset} />

        <EffectsLayer effects={activeEffects} reduced={reduced} />
        <EventNotification toasts={state.toasts} onDismiss={chaos.dismissToast} />

        <ConfirmDialog
          open={pendingReset !== null}
          title={pendingReset ? RESET_COPY[pendingReset].title : ''}
          description={pendingReset ? RESET_COPY[pendingReset].description : ''}
          confirmLabel={pendingReset ? RESET_COPY[pendingReset].confirmLabel : 'Confirm'}
          onConfirm={confirmReset}
          onCancel={() => setPendingReset(null)}
        />
      </div>
    </MotionConfig>
  );
}
