import type { ReadStatus } from './storage';

/** Human-friendly explanation for storage problems, or null when everything is fine. */
export function getStorageNotice(statuses: readonly ReadStatus[]): string | null {
  if (statuses.includes('unavailable')) {
    return "Your browser is blocking local storage, so settings and progress won't be saved after you leave. Everything else still works.";
  }
  if (statuses.includes('corrupt')) {
    return 'Some saved data was unreadable, so it was safely reset to defaults. Your other data was not affected.';
  }
  return null;
}
