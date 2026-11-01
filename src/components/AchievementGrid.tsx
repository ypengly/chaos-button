import { Check, Lock } from 'lucide-react';
import type { AchievementProgress } from '../features/achievements/achievementService';
import { FX_TARGET } from '../utils/css';
import { formatDate } from '../utils/formatters';

interface AchievementGridProps {
  items: readonly AchievementProgress[];
}

export function AchievementGrid({ items }: AchievementGridProps) {
  const unlockedCount = items.filter((item) => item.unlocked).length;

  return (
    <section id="achievements" aria-labelledby="achievements-title" className="px-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="eyebrow">Bragging rights</p>
          <h2 id="achievements-title" className="font-display text-3xl font-extrabold text-ink sm:text-4xl">
            Achievements
          </h2>
        </div>
        <p className="text-sm font-semibold text-muted" data-testid="achievement-count">
          {unlockedCount} of {items.length} unlocked
        </p>
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ definition, current, target, unlocked, unlockedAt }) => {
          const percent = Math.round((current / target) * 100);
          const descId = `ach-${definition.id}-desc`;
          return (
            <li
              key={definition.id}
              className={`card ${FX_TARGET} flex gap-4 p-4 ${unlocked ? 'border-accent' : ''}`}
              data-testid={`achievement-${definition.id}`}
              data-unlocked={unlocked}
              title={definition.description}
              aria-describedby={descId}
            >
              <div
                className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl ${
                  unlocked ? 'bg-accent/15' : 'bg-line grayscale'
                }`}
                aria-hidden="true"
              >
                {unlocked ? definition.emoji : <Lock size={24} />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="flex flex-wrap items-center gap-x-2 font-bold text-ink">
                  {definition.name}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-extrabold uppercase ${
                      unlocked ? 'bg-accent text-on-accent' : 'border border-line text-muted'
                    }`}
                  >
                    {unlocked ? (
                      <>
                        <Check size={12} aria-hidden="true" /> Unlocked
                      </>
                    ) : (
                      <>
                        <Lock size={12} aria-hidden="true" /> Locked
                      </>
                    )}
                  </span>
                </h3>
                <p id={descId} className="mt-0.5 text-sm text-muted">
                  {definition.description}
                </p>
                {unlocked ? (
                  unlockedAt ? (
                    <p className="mt-2 text-xs font-semibold text-muted">Unlocked {formatDate(unlockedAt)}</p>
                  ) : null
                ) : (
                  <div className="mt-2">
                    <div
                      role="progressbar"
                      aria-label={`${definition.name} progress`}
                      aria-valuemin={0}
                      aria-valuemax={target}
                      aria-valuenow={current}
                      className="h-2.5 overflow-hidden rounded-full bg-line"
                    >
                      <div className="h-full rounded-full bg-accent-2" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="mt-1 text-xs font-semibold tabular-nums text-muted">
                      {current} / {target}
                    </p>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
