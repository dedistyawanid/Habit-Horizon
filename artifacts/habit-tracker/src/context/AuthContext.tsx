import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase, setCurrentUserId } from "@/lib/supabase";
import {
  fetchAllFromCloud, fetchProfile, applyProfileToLocalStorage,
} from "@/lib/fetchFromCloud";

/* sessionStorage key used to pass a toast message to the app shell */
const SYNC_TOAST_KEY = "dedi_sync_toast";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  /**
   * true only during the very first auth + cloud-hydration phase.
   * After that the app renders and sync indicators handle status.
   */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => {},
});

/** Sets the user ID and fetches cloud data.  Never throws. Returns quickly on timeout/error. */
async function hydrateFromCloud(userId: string): Promise<void> {
  setCurrentUserId(userId);
  if (!navigator.onLine) return;

  try {
    const [syncResult, profile] = await Promise.all([
      fetchAllFromCloud(userId),
      fetchProfile(userId),
    ]);

    if (syncResult === "timeout") {
      /* Flag a toast for the app shell to show once mounted */
      sessionStorage.setItem(
        SYNC_TOAST_KEY,
        JSON.stringify({ title: "Using local data", description: "Cloud sync timed out — your data will sync when the connection improves.", variant: "default" })
      );
    }

    if (profile) applyProfileToLocalStorage(profile);
  } catch {
    /* Silently fall through — localStorage data will be used */
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async (u: User) => {
    await hydrateFromCloud(u.id);
  }, []);

  useEffect(() => {
    let mounted = true;

    /* ── Initial session restore (page refresh) ── */
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const u = data.session?.user ?? null;
      setSession(data.session);

      if (u) {
        /* Hydrate BEFORE setting user so AppProvider mounts with fresh localStorage */
        await hydrate(u);
        if (mounted) setUser(u);
      }

      if (mounted) setLoading(false);
    });

    /* ── Subsequent auth changes (fresh sign-in / sign-out) ── */
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      if (!mounted) return;
      const u = sess?.user ?? null;
      setSession(sess);

      if (u) {
        /* Show loading screen again while we re-hydrate for the new user */
        setLoading(true);
        await hydrate(u);
        if (mounted) {
          setUser(u);
          setLoading(false);
        }
      } else {
        setCurrentUserId("dedi");
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [hydrate]);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  };

  const signUp = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({ email, password });
    return error?.message ?? null;
  };

  const signOut = async () => {
    const keysToRemove = [
      "dedi_habits", "dedi_checkins", "dedi_activity_log",
      "dedi_nutrition_log", "dedi_sleep_log", "dedi_weight_log",
      "dedi_transactions", "dedi_quick_notes",
      "dedi_sync_queue", "dedi_supabase_migrated_v1",
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    setCurrentUserId("dedi");
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
