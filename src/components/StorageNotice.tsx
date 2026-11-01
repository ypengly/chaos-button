import { useState } from 'react';
import { TriangleAlert, X } from 'lucide-react';
import { getStorageNotice } from '../utils/storageNotice';
import type { ReadStatus } from '../utils/storage';

interface StorageNoticeProps {
  statuses: readonly ReadStatus[];
}

/** Friendly, dismissible warning when saved data is corrupt or storage is unavailable. */
export function StorageNotice({ statuses }: StorageNoticeProps) {
  const [dismissed, setDismissed] = useState(false);
  const message = getStorageNotice(statuses);
  if (!message || dismissed) return null;

  return (
    <div
      role="status"
      className="mx-auto mt-4 flex max-w-3xl items-start gap-3 rounded-2xl border-2 border-sun bg-surface px-4 py-3 text-sm text-ink"
      data-testid="storage-notice"
    >
      <TriangleAlert size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p className="flex-1">{message}</p>
      <button
        type="button"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-line"
        aria-label="Dismiss storage notice"
        onClick={() => setDismissed(true)}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
