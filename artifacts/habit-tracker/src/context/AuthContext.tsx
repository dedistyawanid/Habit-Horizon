import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase, setCurrentUserId } from "@/lib/supabase";
import {
  fetchAllFromCloud, fetchProfile, applyProfileToLocalStorage,
} from "@/lib/fetchFromCloud";

const SYNC_TOAST_KEY = "dedi_sync_toast";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  /** true only during the brief Supabase session check (< 200ms typically) */
  loading: boolean;
  /** true while background cloud hydration is in progress */
  hydrating: boolean;
  /** bumped each time a hydration cycle completes successfully */
  hydratedAt: number;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  hydrating: false,
  hydratedAt: 0,
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => {},
});

/** Fetches cloud data into localStorage in the background. Never throws. */
async function hydrateFromCloud(userId: string): Promise<void> {
  setCurrentUserId(userId);
  if (!navigator.onLine) return;
  try {
    const [syncResult, profile] = await Promise.all([
      fetchAllFromCloud(userId),
      fetchProfile(userId),
    ]);
    if (syncResult === "timeout") {
      sessionStorage.setItem(
        SYNC_TOAST_KEY,
        JSON.stringify({ title: "Using local data", description: "Cloud sync timed out — your data will sync when the connection improves." })
      );
    }
    if (profile) applyProfileToLocalStorage(profile);
  } catch {
    /* Silently fall through — localStorage data will be used */
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,       setUser]       = useState<User | null>(null);
  const [session,    setSession]    = useState<Session | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [hydrating,  setHydrating]  = useState(false);
  const [hydratedAt, setHydratedAt] = useState(0);
  const hydratingRef = useRef(false);

  /** Run cloud hydration in the background without blocking the UI. */
  const hydrate = useCallback(async (u: User) => {
    if (hydratingRef.current) return;
    hydratingRef.current = true;
    setHydrating(true);
    try {
      await hydrateFromCloud(u.id);
      setHydratedAt(Date.now());
    } finally {
      hydratingRef.current = false;
      setHydrating(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    /* ── Initial session restore (page refresh) ── */
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const u = data.session?.user ?? null;
      setSession(data.session);

      if (u) {
        setCurrentUserId(u.id);
        setUser(u);
        setLoading(false);
        /* Hydrate in the background — app is already interactive */
        hydrate(u);
      } else {
        setLoading(false);
      }
    });

    /* ── Subsequent auth changes (sign-in / sign-out) ── */
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      if (!mounted) return;
      const u = sess?.user ?? null;
      setSession(sess);

      if (u) {
        setCurrentUserId(u.id);
        setUser(u);
        /* Hydrate in the background after sign-in */
        hydrate(u);
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
    <AuthContext.Provider value={{ user, session, loading, hydrating, hydratedAt, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
