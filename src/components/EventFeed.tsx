import { AnimatePresence, motion } from 'framer-motion';
import { Eraser, Star } from 'lucide-react';
import type { FeedEntry } from '../types';
import { formatSessionTime } from '../utils/formatters';

interface EventFeedProps {
  entries: readonly FeedEntry[];
  onClear: () => void;
}

export function EventFeed({ entries, onClear }: EventFeedProps) {
  return (
    <section aria-labelledby="feed-title" className="card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="feed-title" className="font-display text-2xl font-extrabold text-ink">
          Event feed
        </h2>
        <button type="button" className="pill text-sm" onClick={onClear} disabled={entries.length === 0}>
          <Eraser size={16} aria-hidden="true" />
          Clear feed
        </button>
      </div>
      <p className="mt-1 text-sm text-muted">Newest first. Only the last 20 events are kept.</p>

      {entries.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-line px-4 py-6 text-center text-muted">
          Nothing yet. Press the button. (Or don&apos;t. You will.)
        </p>
      ) : (
        <ol aria-label="Recent chaos events" className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {entries.map((entry) => (
              <motion.li
                key={entry.id}
                layout="position"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 rounded-2xl border border-line bg-bg/60 px-3 py-2.5"
                data-testid="feed-entry"
              >
                <span className="text-2xl" aria-hidden="true">
                  {entry.emoji}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold text-ink">{entry.name}</span>
                {entry.rarity === 'rare' ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-xs font-extrabold uppercase text-bg">
                    <Star size={12} aria-hidden="true" /> Rare
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-xs font-semibold text-muted">
                    Standard
                  </span>
                )}
                <time className="shrink-0 text-xs font-semibold tabular-nums text-muted" title="Time since session start">
                  +{formatSessionTime(entry.offsetMs)}
                </time>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
    </section>
  );
}
