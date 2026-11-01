import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Toast } from '../types';

interface EventNotificationProps {
  toasts: readonly Toast[];
  onDismiss: (id: string) => void;
}

const TOAST_MS: Record<Toast['kind'], number> = {
  rare: 3800,
  achievement: 5000,
  levelup: 5000,
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), TOAST_MS[toast.kind]);
    return () => clearTimeout(timer);
  }, [toast.id, toast.kind, onDismiss]);

  const accent =
    toast.kind === 'rare' ? 'border-sun' : toast.kind === 'levelup' ? 'border-accent' : 'border-accent-2';

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.25 }}
      // Rare events are already announced by the message live region, so avoid a second announcement.
      role={toast.announce ? 'status' : undefined}
      aria-hidden={toast.announce ? undefined : true}
      className={`pointer-events-auto flex items-start gap-3 rounded-2xl border-2 bg-surface p-3.5 pr-2 text-ink shadow-xl ${accent}`}
      data-testid="toast"
    >
      <span className="text-2xl" aria-hidden="true">
        {toast.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold">{toast.title}</p>
        <p className="text-sm text-muted">{toast.body}</p>
      </div>
      <button
        type="button"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-line"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        tabIndex={toast.announce ? 0 : -1}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </motion.li>
  );
}

export function EventNotification({ toasts, onDismiss }: EventNotificationProps) {
  return (
    <ul
      className="pointer-events-none fixed right-3 top-20 z-50 flex w-[min(92vw,22rem)] flex-col gap-2"
      aria-label="Notifications"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </ul>
  );
}
