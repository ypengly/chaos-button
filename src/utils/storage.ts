/** The subset of the Web Storage API this app relies on. */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type ReadStatus = 'ok' | 'missing' | 'corrupt' | 'unavailable';

export interface ReadResult<T> {
  value: T;
  status: ReadStatus;
}

/** Accessing window.localStorage can itself throw (blocked cookies, sandboxed iframes). */
export function getLocalStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getSessionStorage(): StorageLike | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Reads and validates JSON. `parse` receives the decoded value and returns the
 * typed result, or null when the data is not usable. Never throws: corrupt or
 * unavailable storage yields the fallback plus a status the UI can explain.
 */
export function readJSON<T>(
  key: string,
  parse: (raw: unknown) => T | null,
  fallback: () => T,
  storage: StorageLike | null = getLocalStorage(),
): ReadResult<T> {
  if (!storage) {
    return { value: fallback(), status: 'unavailable' };
  }

  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return { value: fallback(), status: 'unavailable' };
  }

  if (raw === null) {
    return { value: fallback(), status: 'missing' };
  }

  try {
    const parsed = parse(JSON.parse(raw));
    if (parsed === null) {
      return { value: fallback(), status: 'corrupt' };
    }
    return { value: parsed, status: 'ok' };
  } catch {
    return { value: fallback(), status: 'corrupt' };
  }
}

/** Returns true when the value was stored. Quota and privacy-mode errors are swallowed. */
export function writeJSON(
  key: string,
  value: unknown,
  storage: StorageLike | null = getLocalStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeItem(key: string, storage: StorageLike | null = getLocalStorage()): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isNonNegativeInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && Number.isInteger(value);
}
