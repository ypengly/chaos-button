import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import type { LevelInfo } from '../types';
import { FX_TARGET } from '../utils/css';
import { pluralize } from '../utils/formatters';

interface ChaosLevelProps {
  level: LevelInfo;
  presses: number;
  /** Increments on every level-up so the celebration replays. */
  levelUpSignal: number;
}

export function ChaosLevel({ level, presses, levelUpSignal }: ChaosLevelProps) {
  const percent = Math.round(level.progress * 100);
  const isMax = level.pressesToNext === null;

  return (
    <motion.section
      key={levelUpSignal}
      aria-labelledby="level-title"
      className={`card ${FX_TARGET} p-5 sm:p-6`}
      initial={levelUpSignal > 0 ? { scale: 0.94 } : false}
      animate={levelUpSignal > 0 ? { scale: [0.94, 1.05, 1] } : undefined}
      transition={{ duration: 0.5 }}
      data-testid="chaos-level"
    >
      <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent text-on-accent" aria-hidden="true">
          <Flame size={28} />
        </div>
        <div className="min-w-0">
          <p className="eyebrow">Chaos level</p>
          <h2 id="level-title" className="font-display text-2xl font-extrabold leading-tight text-ink sm:text-3xl">
            Level {level.level}: {level.title}
          </h2>
          <p className="mt-1 text-sm text-muted sm:text-base">{level.description}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex items-baseline justify-between text-sm font-semibold">
          <span className="text-ink">{pluralize(presses, 'press', 'presses')} this session</span>
          <span className="text-muted">
            {isMax ? 'Max level reached' : `${pluralize(level.pressesToNext ?? 0, 'press', 'presses')} to ${level.nextTitle}`}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Progress to next chaos level"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={isMax ? 'Maximum level reached' : `${percent}% of the way to ${level.nextTitle}`}
          className="h-3.5 overflow-hidden rounded-full bg-line"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-pink transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </motion.section>
  );
}
