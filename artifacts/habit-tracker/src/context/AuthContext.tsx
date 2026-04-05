import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase, setCurrentUserId } from "@/lib/supabase";
import { fetchAllFromCloud, fetchProfile, applyProfileToLocalStorage } from "@/lib/fetchFromCloud";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  /**
   * true while Supabase auth is resolving OR while we're fetching cloud data.
   * The app must not render until this is false.
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

async function hydrateFromCloud(userId: string) {
  setCurrentUserId(userId);
  const [, profile] = await Promise.all([
    fetchAllFromCloud(userId),
    fetchProfile(userId),
  ]);
  if (profile) applyProfileToLocalStorage(profile);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  /**
   * loading stays true until BOTH auth resolution AND cloud hydration are done.
   * This guarantees AppProvider always mounts with fresh cloud data in localStorage.
   */
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async (u: User) => {
    try { await hydrateFromCloud(u.id); } catch { /* offline — use localStorage */ }
  }, []);

  useEffect(() => {
    let mounted = true;

    /* ── Initial session restore ── */
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const u = data.session?.user ?? null;
      setSession(data.session);
      if (u) {
        await hydrate(u);       // fetch cloud → localStorage BEFORE setting user
        if (mounted) setUser(u);
      }
      if (mounted) setLoading(false);
    });

    /* ── Subsequent auth changes (sign-in / sign-out) ── */
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      if (!mounted) return;
      const u = sess?.user ?? null;
      setSession(sess);

      if (u) {
        setLoading(true);         // show loading screen while re-hydrating
        await hydrate(u);         // fetch cloud → localStorage
        if (mounted) {
          setUser(u);
          setLoading(false);
        }
      } else {
        setCurrentUserId("dedi");
        setUser(null);
        // don't touch loading here — sign-out immediately shows LoginPage
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
