import { useCallback, useRef, useState } from 'react';
import { getLocalStorage, readJSON, writeJSON, type ReadStatus } from '../utils/storage';

type Updater<T> = T | ((previous: T) => T);

/**
 * useState backed by localStorage. Stored data is validated by `parse`; corrupt or
 * unavailable storage falls back to the defaults and reports a status the UI can show.
 * Writes are synchronous with the update and never throw.
 */
export function useLocalStorage<T>(
  key: string,
  getDefault: () => T,
  parse: (raw: unknown) => T | null,
): readonly [T, (update: Updater<T>) => void, ReadStatus] {
  const [initial] = useState(() => readJSON(key, parse, getDefault, getLocalStorage()));
  const [value, setValue] = useState<T>(initial.value);
  const valueRef = useRef<T>(initial.value);

  const update = useCallback(
    (next: Updater<T>) => {
      const resolved = typeof next === 'function' ? (next as (previous: T) => T)(valueRef.current) : next;
      valueRef.current = resolved;
      setValue(resolved);
      writeJSON(key, resolved);
    },
    [key],
  );

  return [value, update, initial.status] as const;
}
