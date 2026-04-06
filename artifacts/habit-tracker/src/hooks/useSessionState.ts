import { useState, useCallback } from "react";

/**
 * Drop-in replacement for useState that persists the value to sessionStorage.
 * Values survive tab-switching but are cleared when the browser session ends.
 */
export function useSessionState<T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setInternalState] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(key);
      if (stored !== null) return JSON.parse(stored) as T;
    } catch { /* ignore */ }
    return defaultValue;
  });

  const setState: React.Dispatch<React.SetStateAction<T>> = useCallback(
    (action) => {
      setInternalState((prev) => {
        const next =
          typeof action === "function"
            ? (action as (p: T) => T)(prev)
            : action;
        try { sessionStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    },
    [key]
  );

  return [state, setState];
}
