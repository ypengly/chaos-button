import { memo, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { ActiveEffect, EffectConfig } from '../types';
import { cssVars } from '../utils/css';
import { mulberry32, pickOne, randomBetween } from '../utils/random';

interface EffectsLayerProps {
  effects: readonly ActiveEffect[];
  /** Reduced motion: only fade-based overlays render; moving particles are skipped. */
  reduced: boolean;
}

const CONFETTI_COLORS = ['#f43f5e', '#8b5cf6', '#3b82f6', '#facc15', '#22c55e', '#ec4899', '#fb923c'];

function scaledCount(base: number, fx: ActiveEffect): number {
  return Math.max(0, Math.round(base * fx.density * fx.particleScale));
}

function fadeTimes(durationMs: number) {
  return { duration: durationMs / 1000, times: [0, 0.12, 0.82, 1], ease: 'easeInOut' as const };
}

/* ---------------------------- particle pieces ---------------------------- */

function RainParticles({ fx, count }: { fx: ActiveEffect; count: number }) {
  const pieces = useMemo(() => {
    const rng = mulberry32(fx.seed ^ 0x1111);
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      emoji: pickOne(fx.emojiPool, rng),
      left: randomBetween(rng, 0, 98),
      size: randomBetween(rng, 22, 48),
      dur: randomBetween(rng, 2.2, 3.6),
      delay: randomBetween(rng, 0, 0.9),
      drift: randomBetween(rng, -60, 60),
      spin: randomBetween(rng, -360, 360),
    }));
  }, [count, fx.seed, fx.emojiPool]);

  return (
    <>
      {pieces.map((p) => (
        <span
          key={p.key}
          className="fx-piece fx-rain"
          style={{
            left: `${p.left}%`,
            fontSize: p.size,
            ...cssVars({
              '--dur': `${p.dur}s`,
              '--delay': `${p.delay}s`,
              '--drift': `${p.drift}px`,
              '--spin': `${p.spin}deg`,
            }),
          }}
        >
          {p.emoji}
        </span>
      ))}
    </>
  );
}

function BurstParticles({
  fx,
  style,
  count,
  salt,
}: {
  fx: ActiveEffect;
  style: 'confetti' | 'popcorn';
  count: number;
  salt: number;
}) {
  const pieces = useMemo(() => {
    const rng = mulberry32(fx.seed ^ (0x2222 + salt));
    const spread = Math.min(520, (typeof window === 'undefined' ? 900 : window.innerWidth) * 0.45);
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      color: pickOne(CONFETTI_COLORS, rng),
      emoji: style === 'popcorn' ? (rng() < 0.8 ? '🍿' : '🌽') : '',
      w: randomBetween(rng, 6, 10),
      h: randomBetween(rng, 9, 15),
      round: rng() < 0.3,
      size: randomBetween(rng, 22, 38),
      dx: randomBetween(rng, -spread, spread),
      peak: -randomBetween(rng, style === 'popcorn' ? 160 : 120, style === 'popcorn' ? 420 : 340),
      fall: randomBetween(rng, 60, style === 'popcorn' ? 320 : 460),
      spin: randomBetween(rng, -720, 720),
      dur: randomBetween(rng, 1.7, 2.6),
      delay: randomBetween(rng, 0, 0.15),
    }));
  }, [count, fx.seed, style, salt]);

  return (
    <>
      {pieces.map((p) => (
        <span
          key={p.key}
          className="fx-piece fx-burst"
          style={{
            left: fx.origin.x,
            top: fx.origin.y,
            ...(style === 'confetti'
              ? {
                  width: p.w,
                  height: p.h,
                  backgroundColor: p.color,
                  borderRadius: p.round ? '9999px' : '2px',
                }
              : { fontSize: p.size }),
            ...cssVars({
              '--dx': `${p.dx}px`,
              '--peak': `${p.peak}px`,
              '--fall': `${p.fall}px`,
              '--spin': `${p.spin}deg`,
              '--dur': `${p.dur}s`,
              '--delay': `${p.delay}s`,
            }),
          }}
        >
          {style === 'popcorn' ? p.emoji : null}
        </span>
      ))}
    </>
  );
}

function SparkleParticles({ fx, count }: { fx: ActiveEffect; count: number }) {
  const pieces = useMemo(() => {
    const rng = mulberry32(fx.seed ^ 0x3333);
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      left: randomBetween(rng, 2, 96),
      top: randomBetween(rng, 18, 92),
      size: randomBetween(rng, 16, 30),
      dur: randomBetween(rng, 1.8, 3.2),
      delay: randomBetween(rng, 0, 1.8),
    }));
  }, [count, fx.seed]);

  return (
    <>
      {pieces.map((p) => (
        <span
          key={p.key}
          className="fx-piece fx-sparkle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            fontSize: p.size,
            ...cssVars({ '--dur': `${p.dur}s`, '--delay': `${p.delay}s` }),
          }}
        >
          ✨
        </span>
      ))}
    </>
  );
}

function StarParticles({ fx, count }: { fx: ActiveEffect; count: number }) {
  const pieces = useMemo(() => {
    const rng = mulberry32(fx.seed ^ 0x4444);
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      left: randomBetween(rng, 1, 99),
      top: randomBetween(rng, 2, 98),
      size: randomBetween(rng, 2, 4.5),
      dur: randomBetween(rng, 2.4, 4.2),
      delay: randomBetween(rng, 0, 2),
      drift: randomBetween(rng, -10, 10),
    }));
  }, [count, fx.seed]);

  return (
    <>
      {pieces.map((p) => (
        <span
          key={p.key}
          className="fx-piece fx-star"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            ...cssVars({ '--dur': `${p.dur}s`, '--delay': `${p.delay}s`, '--drift': `${p.drift}px` }),
          }}
        />
      ))}
    </>
  );
}

/* ----------------------------- overlay pieces ---------------------------- */

function GiantEmoji({ fx, reduced }: { fx: ActiveEffect; reduced: boolean }) {
  const emoji = fx.giantEmoji ?? fx.emoji;
  return (
    <motion.div
      className="absolute inset-0 grid place-items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={fadeTimes(fx.durationMs)}
    >
      <motion.span
        style={{ fontSize: 'min(46vw, 17rem)', lineHeight: 1, filter: 'drop-shadow(0 12px 24px rgb(0 0 0 / 0.3))' }}
        initial={reduced ? false : { scale: 0.2, rotate: -18 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 13 }}
      >
        {emoji}
      </motion.span>
    </motion.div>
  );
}

function DramaticText({ fx, text }: { fx: ActiveEffect; text: string }) {
  return (
    <motion.div
      className="absolute inset-0 grid place-items-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: fx.durationMs / 1000, times: [0, 0.2, 0.78, 1], ease: 'easeInOut' }}
    >
      <p className="max-w-[22ch] rounded-3xl bg-black/75 px-6 py-5 text-center font-display text-3xl font-extrabold leading-tight text-white shadow-2xl sm:text-5xl">
        {text}
      </p>
    </motion.div>
  );
}

function Banner({ fx, text }: { fx: ActiveEffect; text: string }) {
  return (
    <motion.div
      className="absolute inset-x-0 top-20 flex justify-center px-4"
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: [0, 1, 1, 0], y: [-24, 0, 0, -24] }}
      transition={fadeTimes(fx.durationMs)}
    >
      <p className="max-w-full rounded-full border-2 border-white/70 bg-black/75 px-5 py-2.5 text-center text-sm font-bold text-white shadow-xl sm:text-base">
        {text}
      </p>
    </motion.div>
  );
}

function LoadingBar({ fx, statuses, reduced }: { fx: ActiveEffect; statuses: readonly string[]; reduced: boolean }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (statuses.length < 2) return undefined;
    const interval = setInterval(
      () => setIndex((i) => Math.min(statuses.length - 1, i + 1)),
      Math.max(900, fx.durationMs / statuses.length),
    );
    return () => clearInterval(interval);
  }, [statuses, fx.durationMs]);

  return (
    <motion.div
      className="absolute inset-x-0 bottom-8 flex justify-center px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, 20] }}
      transition={fadeTimes(fx.durationMs)}
    >
      <div className="w-[min(92vw,26rem)] rounded-2xl border-2 border-white/60 bg-black/80 p-4 text-white shadow-2xl">
        <p className="mb-2 text-sm font-semibold">{statuses[index] ?? 'Loading…'}</p>
        <div className="h-3 overflow-hidden rounded-full bg-white/25">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-pink-400 via-violet-400 to-sky-400"
            initial={{ width: '0%' }}
            animate={{ width: reduced ? '99%' : ['0%', '45%', '78%', '99%', '99%'] }}
            transition={{ duration: (fx.durationMs / 1000) * 0.85, times: [0, 0.25, 0.55, 0.8, 1], ease: 'easeInOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function Wash({ fx, style }: { fx: ActiveEffect; style: 'disco' | 'rainbow' | 'void' }) {
  return (
    <motion.div
      className={`fx-wash fx-wash--${style}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={fadeTimes(fx.durationMs)}
    >
      {style === 'void' ? null : <div className="fx-wash__strip" />}
    </motion.div>
  );
}

/** Fade-only stand-in for events whose visuals are purely motion, shown in reduced-motion mode. */
function ReducedBadge({ fx }: { fx: ActiveEffect }) {
  return (
    <motion.div
      className="absolute inset-x-0 top-20 flex justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={fadeTimes(fx.durationMs)}
    >
      <p className="rounded-full border-2 border-white/70 bg-black/75 px-5 py-2.5 text-center text-sm font-bold text-white shadow-xl sm:text-base">
        <span aria-hidden="true">{fx.emoji}</span> {fx.name}
      </p>
    </motion.div>
  );
}

const OVERLAY_TYPES: ReadonlyArray<EffectConfig['type']> = ['giantEmoji', 'dramaticText', 'banner', 'loadingBar', 'wash'];

function needsReducedBadge(fx: ActiveEffect): boolean {
  if (fx.eventId === null) return false;
  if (fx.effects.some((config) => config.type === 'palette' || config.type === 'class')) return false;
  return !fx.effects.some((config) => OVERLAY_TYPES.includes(config.type));
}

/* -------------------------------- dispatcher ------------------------------ */

function renderConfig(config: EffectConfig, fx: ActiveEffect, index: number, reduced: boolean) {
  switch (config.type) {
    case 'rain':
      return reduced ? null : <RainParticles key={index} fx={fx} count={scaledCount(config.count, fx)} />;
    case 'burst':
      return reduced ? null : (
        <BurstParticles key={index} fx={fx} style={config.style} count={scaledCount(config.count, fx)} salt={index} />
      );
    case 'sparkles':
      return reduced ? null : <SparkleParticles key={index} fx={fx} count={scaledCount(config.count, fx)} />;
    case 'stars':
      return reduced ? null : <StarParticles key={index} fx={fx} count={scaledCount(config.count, fx)} />;
    case 'giantEmoji':
      return <GiantEmoji key={index} fx={fx} reduced={reduced} />;
    case 'dramaticText':
      return <DramaticText key={index} fx={fx} text={config.text} />;
    case 'banner':
      return <Banner key={index} fx={fx} text={config.text} />;
    case 'loadingBar':
      return <LoadingBar key={index} fx={fx} statuses={config.statuses} reduced={reduced} />;
    case 'wash':
      return <Wash key={index} fx={fx} style={config.style} />;
    // Handled elsewhere: class tokens and palettes live on the app root, clones around the button.
    case 'class':
    case 'palette':
    case 'clones':
      return null;
    default:
      return null;
  }
}

/** Fixed, click-through layer that renders every active effect. Always hidden from assistive tech. */
export const EffectsLayer = memo(function EffectsLayer({ effects, reduced }: EffectsLayerProps) {
  return (
    <div className="fx-layer" aria-hidden="true" data-testid="effects-layer">
      {effects.map((fx) => (
        <div key={fx.id} className="absolute inset-0" data-effect={fx.eventId ?? 'celebration'}>
          {fx.effects.map((config, index) => renderConfig(config, fx, index, reduced))}
          {reduced && needsReducedBadge(fx) ? <ReducedBadge fx={fx} /> : null}
        </div>
      ))}
    </div>
  );
});
