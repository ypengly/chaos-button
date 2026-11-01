import { AnimatePresence, motion } from 'framer-motion';
import { Crown, Dices } from 'lucide-react';
import type { MessageState } from '../types';

interface ChaosMessageProps {
  message: MessageState | null;
}

/**
 * The single, restrained live region for event messages. Screen readers hear one
 * polite announcement per press. Rarity is spelled out in text, not just colour.
 */
export function ChaosMessage({ message }: ChaosMessageProps) {
  const isRare = message?.rarity === 'rare';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="chaos-message"
      className="mx-auto mt-6 min-h-[7.5rem] w-full max-w-xl"
    >
      <AnimatePresence mode="wait" initial={false}>
        {message ? (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className={`card px-5 py-4 text-left ${
              isRare ? 'border-2 border-sun bg-gradient-to-br from-sun/25 via-surface to-pink/20' : ''
            }`}
          >
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-accent">
              <span aria-hidden="true">{message.emoji}</span>
              <span>{message.eventName}</span>
              {isRare ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-xs font-extrabold uppercase tracking-wide text-bg">
                  <Crown size={12} aria-hidden="true" /> Rare event
                </span>
              ) : null}
              {message.source === 'surprise' ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-xs font-bold text-muted">
                  <Dices size={12} aria-hidden="true" /> Surprise pick
                </span>
              ) : null}
            </p>
            <p
              className={`mt-1 text-lg leading-snug sm:text-xl ${
                isRare ? 'font-display font-extrabold text-ink' : 'font-semibold text-ink'
              }`}
            >
              {message.text}
            </p>
          </motion.div>
        ) : (
          <motion.p
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="card px-5 py-4 text-left text-lg font-medium text-muted"
          >
            Waiting for your terrible decision.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
