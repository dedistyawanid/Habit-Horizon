/**
 * RefreshContext — provides a global `refreshFromCloud()` function that:
 *   1. Fetches all data from Supabase → writes to localStorage
 *   2. Increments a key to force-remount AppProvider (re-inits all hooks from fresh localStorage)
 *   3. Returns a summary of what happened
 *
 * The actual state lives in AuthGate (App.tsx) which manages the key.
 */
import React, { createContext, useContext } from "react";

export interface RefreshContextValue {
  refreshing: boolean;
  refreshFromCloud: () => Promise<void>;
}

export const RefreshContext = createContext<RefreshContextValue>({
  refreshing: false,
  refreshFromCloud: async () => {},
});

export function useRefresh() {
  return useContext(RefreshContext);
}

export const RefreshProvider = RefreshContext.Provider;
