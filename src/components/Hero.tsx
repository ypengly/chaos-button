import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Dices } from 'lucide-react';
import type { ButtonMode } from '../hooks/useChaos';
import type { ActiveEffect, MessageState } from '../types';
import { ChaosButton } from './ChaosButton';
import { ChaosMessage } from './ChaosMessage';

interface HeroProps {
  mode: ButtonMode;
  message: MessageState | null;
  activeEffects: readonly ActiveEffect[];
  reduced: boolean;
  disabled: boolean;
  onPress: () => void;
  onSurprise: () => void;
}

function CloneRing({ effect }: { effect: ActiveEffect }) {
  const config = effect.effects.find((item) => item.type === 'clones');
  const count = config && config.type === 'clones' ? config.count : 0;
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true" data-testid="clone-ring">
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: `${50 + 56 * Math.cos(angle)}%`, top: `${46 + 52 * Math.sin(angle)}%`, translate: '-50% -50%' }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 0.85, 0.85, 0], scale: [0.3, 1, 1, 0.5] }}
            transition={{ duration: effect.durationMs / 1000, times: [0, 0.1, 0.85, 1] }}
          >
            <div className="clone grid h-[4.25rem] w-[4.25rem] place-items-center rounded-full border-2 border-dashed border-muted bg-surface/80 text-center text-[0.6rem] font-extrabold uppercase leading-tight text-muted sm:h-20 sm:w-20">
              <span>
                <span className="block text-xl">💥</span>
                decoy
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export const Hero = forwardRef<HTMLButtonElement, HeroProps>(function Hero(
  { mode, message, activeEffects, reduced, disabled, onPress, onSurprise },
  buttonRef,
) {
  const realEvents = activeEffects.filter((effect) => effect.eventId !== null);
  const latest = realEvents[realEvents.length - 1];
  const cloneEffects = activeEffects.filter((effect) => effect.effects.some((item) => item.type === 'clones'));

  return (
    <section id="home" aria-labelledby="hero-title" className="px-4 pb-6 pt-8 text-center sm:pt-12">
      <p className="eyebrow">The internet&apos;s least productive tool.</p>
      <h1
        id="hero-title"
        className="fx-glitch mx-auto mt-3 max-w-3xl font-display text-[clamp(2.25rem,8vw,4.75rem)] font-extrabold leading-[1.02] tracking-tight text-ink"
      >
        One button. <span className="text-accent">Infinite bad decisions.</span>
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base text-muted sm:text-lg">
        Press the big button and something ridiculous happens: confetti, earthquakes, existential dread. Every press is a
        surprise, every surprise is a mistake, and you will absolutely press it again.
      </p>

      <div className="fx-zoom relative mx-auto mt-8 w-fit">
        <ChaosButton ref={buttonRef} mode={mode} onPress={onPress} disabled={disabled} reduced={reduced} />
        {cloneEffects.map((effect) => (
          <CloneRing key={effect.id} effect={effect} />
        ))}
        {cloneEffects.length > 0 ? (
          <p className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-3 py-1 text-xs font-bold text-bg">
            ★ The real one is the solid one
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button type="button" className="pill" onClick={onSurprise} disabled={disabled}>
          <Dices size={18} aria-hidden="true" />
          Surprise me
        </button>
      </div>

      <p className="mt-5 text-sm font-semibold text-muted" data-testid="chaos-state">
        Chaos state:{' '}
        <span className="text-ink">
          {latest ? `${latest.emoji} ${latest.name} in progress` : 'eerily calm. Suspiciously calm.'}
        </span>
      </p>

      <ChaosMessage message={message} />
    </section>
  );
});
