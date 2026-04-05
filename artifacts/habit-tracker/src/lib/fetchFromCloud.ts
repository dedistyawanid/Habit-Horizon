/**
 * fetchFromCloud — pulls all user data from Supabase and writes it to localStorage.
 * Cloud data WINS over local data.
 * 4-second overall timeout — falls back gracefully to localStorage.
 *
 * Table map (confirmed):
 *   habits, checkins, health_logs, nutrition_logs, sleep_logs,
 *   weight_logs, finance_logs, notes, profiles
 */
import { supabase } from "./supabase";

export interface CloudProfile {
  user_id: string;
  display_name: string | null;
  target_weight: number | null;
  calorie_goal: number | null;
  protein_goal: number | null;
  carbs_goal: number | null;
  theme_selection: string | null;
  updated_at: string;
}

function safeJson<T>(raw: string | null, fallback: T): T {
  try { return raw ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p,
    new Promise<null>((res) => setTimeout(() => res(null), ms)),
  ]);
}

async function fetchTable(table: string, userId: string) {
  const r = await withTimeout(
    supabase.from(table).select("*").eq("user_id", userId),
    3500,
  );
  if (!r || r.error) {
    if (r?.error) console.warn(`[cloud] fetch failed (${table}):`, r.error.message);
    return null;
  }
  return r.data;
}

/* ── full pull: Supabase → localStorage ── */
export async function fetchAllFromCloud(
  userId: string,
): Promise<"synced" | "no_data" | "timeout" | "offline" | "error"> {
  if (!navigator.onLine) return "offline";
  try {
    /* Run all 8 table fetches in parallel, capped at 4 s total */
    const overall = Promise.all([
      fetchTable("habits",         userId),
      fetchTable("checkins",       userId),
      fetchTable("health_logs",    userId),   // ← was activity_logs
      fetchTable("nutrition_logs", userId),
      fetchTable("sleep_logs",     userId),
      fetchTable("weight_logs",    userId),
      fetchTable("finance_logs",   userId),
      fetchTable("notes",          userId),
    ]);

    const results = await withTimeout(overall, 4000);
    if (!results) return "timeout";

    const [habits, checkins, health, meals, sleeps, weights, txns, notes] = results;
    let wrote = false;

    if (habits?.length) {
      localStorage.setItem("dedi_habits", JSON.stringify(
        habits.map((h) => ({
          id: h.id, name: h.name, category: h.category,
          frequency: h.frequency ?? "Daily", color: h.color, icon: h.icon,
          createdAt: h.created_at,
          weeklyStreakTarget: h.weekly_streak_target ?? undefined,
          targetDays: h.target_days ? safeJson<number[] | undefined>(h.target_days, undefined) : undefined,
        }))
      ));
      wrote = true;
    }

    if (checkins?.length) {
      localStorage.setItem("dedi_checkins", JSON.stringify(
        checkins.map((c) => ({
          id: c.id, habitId: c.habit_id, date: c.date,
          notes: c.notes ?? "", completedAt: c.completed_at,
        }))
      ));
      wrote = true;
    }

    if (health?.length) {
      localStorage.setItem("dedi_activity_log", JSON.stringify(
        health.map((a) => ({
          id: a.id,
          date: a.date,
          type: a.type ?? "Other",       // null-safe: column may not exist yet
          durationMin: a.duration_min != null ? Number(a.duration_min) : undefined,
          distanceKm:  a.distance_km  != null ? Number(a.distance_km)  : undefined,
          elevationGain: a.elevation_gain != null ? Number(a.elevation_gain) : undefined,
          runType: a.run_type ?? undefined,
          notes: a.notes ?? undefined,
          createdAt: a.created_at,
        }))
      ));
      wrote = true;
    }

    if (meals?.length) {
      localStorage.setItem("dedi_nutrition_log", JSON.stringify(
        meals.map((m) => ({
          id: m.id, date: m.date, name: m.name,
          calories: m.calories, protein: m.protein, carbs: m.carbs ?? 0,
          createdAt: m.created_at,
        }))
      ));
      wrote = true;
    }

    if (sleeps?.length) {
      localStorage.setItem("dedi_sleep_log", JSON.stringify(
        sleeps.map((s) => ({
          id: s.id, date: s.date,
          hours: s.hours, minutes: s.minutes ?? 0, quality: s.quality,
          createdAt: s.created_at,
        }))
      ));
      wrote = true;
    }

    if (weights?.length) {
      localStorage.setItem("dedi_weight_log", JSON.stringify(
        weights.map((w) => ({ id: w.id, date: w.date, weight: w.weight }))
      ));
      wrote = true;
    }

    if (txns?.length) {
      localStorage.setItem("dedi_transactions", JSON.stringify(
        txns.map((t) => ({
          id: t.id, title: t.note ?? "Transaction",
          amount: t.amount, date: t.date,
          category: t.category ?? "Other", type: t.type,
          createdAt: t.created_at,
        }))
      ));
      wrote = true;
    }

    if (notes?.length) {
      localStorage.setItem("dedi_quick_notes", JSON.stringify(
        notes.map((n) => ({
          id: n.id, title: n.title, content: n.content ?? "",
          category: n.category, createdAt: n.created_at, updatedAt: n.updated_at,
        }))
      ));
      wrote = true;
    }

    return wrote ? "synced" : "no_data";
  } catch (e) {
    console.warn("fetchAllFromCloud error:", e);
    return "error";
  }
}

/* ── profile ── */
export async function fetchProfile(userId: string): Promise<CloudProfile | null> {
  try {
    const r = await withTimeout(
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      3000,
    );
    if (!r || r.error) return null;
    return r.data as CloudProfile | null;
  } catch { return null; }
}

export async function upsertProfile(
  profile: Partial<CloudProfile> & { user_id: string },
): Promise<void> {
  try {
    await supabase.from("profiles").upsert(
      { ...profile, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  } catch (e) { console.warn("Profile upsert failed:", e); }
}

export function applyProfileToLocalStorage(profile: CloudProfile) {
  if (profile.target_weight != null) {
    localStorage.setItem("dedi_goal_weight", String(profile.target_weight));
  }
  if (
    profile.calorie_goal != null ||
    profile.protein_goal != null ||
    profile.carbs_goal   != null
  ) {
    const existing = safeJson<Record<string, number>>(
      localStorage.getItem("dedi_nutrition_targets"), {}
    );
    const merged = {
      calories: existing.calories ?? 2500,
      protein:  existing.protein  ?? 150,
      carbs:    existing.carbs    ?? 300,
      ...(profile.calorie_goal != null ? { calories: profile.calorie_goal } : {}),
      ...(profile.protein_goal != null ? { protein:  profile.protein_goal } : {}),
      ...(profile.carbs_goal   != null ? { carbs:    profile.carbs_goal }   : {}),
    };
    localStorage.setItem("dedi_nutrition_targets", JSON.stringify(merged));
  }
  if (profile.theme_selection) {
    const themeData = safeJson<Record<string, string>>(profile.theme_selection, {});
    const existing  = safeJson<Record<string, unknown>>(
      localStorage.getItem("dedi_app_settings"), {}
    );
    if (themeData.theme)       existing.theme       = themeData.theme;
    if (themeData.accentTheme) existing.accentTheme = themeData.accentTheme;
    localStorage.setItem("dedi_app_settings", JSON.stringify(existing));
  }
  if (profile.display_name) {
    const existing = safeJson<Record<string, unknown>>(
      localStorage.getItem("dedi_app_settings"), {}
    );
    if (!existing.profile || typeof existing.profile !== "object") existing.profile = {};
    (existing.profile as Record<string, unknown>).fullName = profile.display_name;
    localStorage.setItem("dedi_app_settings", JSON.stringify(existing));
  }
}
