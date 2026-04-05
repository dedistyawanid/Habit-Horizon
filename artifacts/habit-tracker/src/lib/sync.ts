/**
 * Sync layer — fire-and-forget upsert/delete helpers.
 * Uses dynamic user ID from supabase.ts (set by AuthContext on login).
 *
 * Table map (confirmed in Supabase):
 *   habits          → habit definitions
 *   checkins        → daily completions
 *   health_logs     → activity / exercise entries   (was: activity_logs)
 *   nutrition_logs  → meal entries
 *   sleep_logs      → sleep entries
 *   weight_logs     → body-weight entries
 *   finance_logs    → income / expense transactions
 *   notes           → quick notes
 */
import { supabase, getUserId } from "./supabase";

/* ─── Offline queue ─────────────────────────────────────── */
const QUEUE_KEY = "dedi_sync_queue";

interface QueuedOp {
  table: string;
  op: "upsert" | "delete";
  id: string;
  row?: Record<string, unknown>;
  ts: number;
}

function enqueue(item: QueuedOp) {
  try {
    const q: QueuedOp[] = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
    const filtered = q.filter((x) => !(x.table === item.table && x.id === item.id));
    filtered.push(item);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch { /* ignore */ }
}

function dequeue(table: string, id: string) {
  try {
    const q: QueuedOp[] = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q.filter((x) => !(x.table === table && x.id === id))));
  } catch { /* ignore */ }
}

export function getQueueSize(): number {
  try { return (JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as QueuedOp[]).length; }
  catch { return 0; }
}

export async function flushQueue(onProgress?: () => void) {
  try {
    const q: QueuedOp[] = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
    if (q.length === 0) return;
    const remaining: QueuedOp[] = [];
    for (const item of q) {
      try {
        if (item.op === "upsert" && item.row) {
          const { error } = await supabase.from(item.table).upsert(item.row, { onConflict: "id" });
          if (error) remaining.push(item);
          else onProgress?.();
        } else if (item.op === "delete") {
          const { error } = await supabase.from(item.table).delete().eq("id", item.id);
          if (error) remaining.push(item);
          else onProgress?.();
        }
      } catch { remaining.push(item); }
    }
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  } catch { /* ignore */ }
}

/* ─── Generic upsert / delete helpers ───────────────────── */
async function upsert(table: string, row: Record<string, unknown>) {
  try {
    const { error } = await supabase.from(table).upsert(row, { onConflict: "id" });
    if (error) {
      console.warn(`[sync] upsert failed (${table}):`, error.message);
      enqueue({ table, op: "upsert", id: row.id as string, row, ts: Date.now() });
    } else {
      dequeue(table, row.id as string);
    }
  } catch (e) {
    console.warn(`[sync] upsert error (${table}):`, e);
    enqueue({ table, op: "upsert", id: row.id as string, row, ts: Date.now() });
  }
}

async function del(table: string, id: string) {
  try {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) enqueue({ table, op: "delete", id, ts: Date.now() });
    else dequeue(table, id);
  } catch { enqueue({ table, op: "delete", id, ts: Date.now() }); }
}

/* ─── Helpers ─────────────────────────────────────────────── */
const num = (v: unknown): number | null => {
  const n = Number(v);
  return isNaN(n) ? null : n;
};

/* ─── Habits ─────────────────────────────────────────────── */
export function syncHabit(h: { id: string; name: string; category?: string; frequency?: string; color?: string; icon?: string; createdAt?: string; weeklyStreakTarget?: number; targetDays?: number[] }) {
  return upsert("habits", {
    id: h.id, user_id: getUserId(), name: h.name,
    category: h.category ?? null,
    frequency: h.frequency ?? "Daily",
    color: h.color ?? null,
    icon: h.icon ?? null,
    created_at: h.createdAt ?? new Date().toISOString(),
    weekly_streak_target: num(h.weeklyStreakTarget),
    target_days: h.targetDays ? JSON.stringify(h.targetDays) : null,
  });
}
export function deleteHabit(id: string) { return del("habits", id); }

export function syncCheckIn(c: { id: string; habitId: string; date: string; notes?: string; completedAt?: string }) {
  return upsert("checkins", {
    id: c.id, user_id: getUserId(), habit_id: c.habitId, date: c.date,
    notes: c.notes ?? null, completed_at: c.completedAt ?? new Date().toISOString(),
  });
}
export function deleteCheckIn(id: string) { return del("checkins", id); }

/* ─── Activity → health_logs ─────────────────────────────── */
export function syncActivity(e: { id: string; date: string; type: string; durationMin?: number; distanceKm?: number; elevationGain?: number; runType?: string; location?: string; notes?: string; createdAt?: string }) {
  return upsert("health_logs", {
    id: e.id, user_id: getUserId(), date: e.date, type: e.type,
    duration_min:   num(e.durationMin),
    distance_km:    num(e.distanceKm),
    elevation_gain: num(e.elevationGain),
    run_type:       e.runType ?? null,
    location:       e.location ?? null,
    notes:          e.notes ?? null,
    created_at:     e.createdAt ?? new Date().toISOString(),
  });
}
export function deleteActivity(id: string) { return del("health_logs", id); }

/* ─── Nutrition ──────────────────────────────────────────── */
export function syncMeal(e: { id: string; date: string; name: string; calories: number; protein: number; carbs?: number; createdAt?: string }) {
  return upsert("nutrition_logs", {
    id: e.id, user_id: getUserId(), date: e.date, name: e.name,
    calories: num(e.calories) ?? 0,
    protein:  num(e.protein)  ?? 0,
    carbs:    num(e.carbs)    ?? 0,
    created_at: e.createdAt ?? new Date().toISOString(),
  });
}
export function deleteMeal(id: string) { return del("nutrition_logs", id); }

/* ─── Sleep ──────────────────────────────────────────────── */
export function syncSleep(e: { id: string; date: string; hours: number; minutes: number; quality: number; createdAt?: string }) {
  return upsert("sleep_logs", {
    id: e.id, user_id: getUserId(), date: e.date,
    hours:   Math.round(num(e.hours)   ?? 0),
    minutes: Math.round(num(e.minutes) ?? 0),
    quality: Math.round(num(e.quality) ?? 0),
  });
}
export function deleteSleep(id: string) { return del("sleep_logs", id); }

/* ─── Weight ─────────────────────────────────────────────── */
export function syncWeight(e: { id: string; date: string; weight: number }) {
  return upsert("weight_logs", {
    id: e.id, user_id: getUserId(), date: e.date,
    weight: num(e.weight) ?? 0,
    created_at: new Date().toISOString(),
  });
}
export function deleteWeight(id: string) { return del("weight_logs", id); }

/* ─── Finance ────────────────────────────────────────────── */
export function syncTransaction(t: { id: string; type: string; amount: number; category?: string; date: string; title?: string; note?: string; notes?: string; createdAt?: string }) {
  return upsert("finance_logs", {
    id: t.id, user_id: getUserId(), type: t.type, amount: t.amount,
    category: t.category ?? null, date: t.date,
    note: t.note ?? t.notes ?? t.title ?? null,
    created_at: t.createdAt ?? new Date().toISOString(),
  });
}
export function deleteTransaction(id: string) { return del("finance_logs", id); }

/* ─── Notes ──────────────────────────────────────────────── */
export function syncNote(n: { id: string; title: string; content?: string; category?: string; createdAt?: string; updatedAt?: string; reminderDate?: string; reminderEnabled?: boolean }) {
  return upsert("notes", {
    id: n.id, user_id: getUserId(), title: n.title, content: n.content ?? null,
    category: n.category ?? null,
    created_at: n.createdAt ?? new Date().toISOString(),
    updated_at: n.updatedAt ?? new Date().toISOString(),
    /* reminder columns — stored if they exist in Supabase, silently ignored if not */
    reminder_date:    n.reminderDate    ?? null,
    reminder_enabled: n.reminderEnabled ?? null,
  });
}
export function deleteNote(id: string) { return del("notes", id); }

/* ─── Force Push: push everything in localStorage to Supabase ─ */
export interface PushResult {
  table: string;
  sent: number;
  success: boolean;
  error?: string;
}

export async function forcePushAll(): Promise<PushResult[]> {
  const uid = getUserId();
  const results: PushResult[] = [];

  async function pushBatch(table: string, rows: Record<string, unknown>[]) {
    if (!rows.length) { results.push({ table, sent: 0, success: true }); return; }
    try {
      const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
      results.push({ table, sent: rows.length, success: !error, error: error?.message });
      if (!error) {
        /* Remove successfully pushed items from offline queue */
        rows.forEach((r) => dequeue(table, r.id as string));
      }
    } catch (e: unknown) {
      results.push({ table, sent: rows.length, success: false, error: String(e) });
    }
  }

  /* habits */
  const habits = JSON.parse(localStorage.getItem("dedi_habits") ?? "[]");
  await pushBatch("habits", habits.map((h: Record<string, unknown>) => ({
    id: h.id, user_id: uid, name: h.name,
    category:             h.category ?? null,
    frequency:            h.frequency ?? "Daily",
    color:                h.color ?? null,
    icon:                 h.icon ?? null,
    created_at:           h.createdAt ?? new Date().toISOString(),
    weekly_streak_target: num(h.weeklyStreakTarget),
    target_days:          Array.isArray(h.targetDays) ? JSON.stringify(h.targetDays) : null,
  })));

  /* checkins */
  const checkins = JSON.parse(localStorage.getItem("dedi_checkins") ?? "[]");
  await pushBatch("checkins", checkins.map((c: Record<string, unknown>) => ({
    id: c.id, user_id: uid, habit_id: c.habitId, date: c.date,
    notes: c.notes ?? null, completed_at: c.completedAt ?? new Date().toISOString(),
  })));

  /* health_logs (activity) */
  const acts = JSON.parse(localStorage.getItem("dedi_activity_log") ?? "[]");
  await pushBatch("health_logs", acts.map((a: Record<string, unknown>) => ({
    id: a.id, user_id: uid, date: a.date, type: a.type,
    duration_min:   num(a.durationMin),
    distance_km:    num(a.distanceKm),
    elevation_gain: num(a.elevationGain),
    run_type:       a.runType ?? null,
    notes:          a.notes ?? null,
    created_at:     a.createdAt ?? new Date().toISOString(),
  })));

  /* nutrition_logs */
  const meals = JSON.parse(localStorage.getItem("dedi_nutrition_log") ?? "[]");
  await pushBatch("nutrition_logs", meals.map((m: Record<string, unknown>) => ({
    id: m.id, user_id: uid, date: m.date, name: m.name,
    calories:   num(m.calories) ?? 0,
    protein:    num(m.protein)  ?? 0,
    carbs:      num(m.carbs)    ?? 0,
    created_at: m.createdAt ?? new Date().toISOString(),
  })));

  /* sleep_logs */
  const sleeps = JSON.parse(localStorage.getItem("dedi_sleep_log") ?? "[]");
  await pushBatch("sleep_logs", sleeps.map((s: Record<string, unknown>) => ({
    id: s.id, user_id: uid, date: s.date,
    hours:   Math.round(num(s.hours)   ?? 0),
    minutes: Math.round(num(s.minutes) ?? 0),
    quality: Math.round(num(s.quality) ?? 0),
  })));

  /* weight_logs */
  const weights = JSON.parse(localStorage.getItem("dedi_weight_log") ?? "[]");
  await pushBatch("weight_logs", weights.map((w: Record<string, unknown>) => ({
    id: w.id, user_id: uid, date: w.date,
    weight:     num(w.weight) ?? 0,
    created_at: new Date().toISOString(),
  })));

  /* finance_logs */
  const txns = JSON.parse(localStorage.getItem("dedi_transactions") ?? "[]");
  await pushBatch("finance_logs", txns.map((t: Record<string, unknown>) => ({
    id: t.id, user_id: uid, type: t.type,
    amount:     num(t.amount) ?? 0,
    category:   t.category ?? null,
    date:       t.date,
    note:       (t.note ?? t.notes ?? t.title ?? null) as string | null,
    created_at: t.createdAt ?? new Date().toISOString(),
  })));

  /* notes */
  const notes = JSON.parse(localStorage.getItem("dedi_quick_notes") ?? "[]");
  await pushBatch("notes", notes.map((n: Record<string, unknown>) => ({
    id: n.id, user_id: uid, title: n.title, content: n.content ?? null,
    category:   n.category ?? null,
    created_at: n.createdAt ?? new Date().toISOString(),
    updated_at: n.updatedAt ?? new Date().toISOString(),
  })));

  return results;
}

/* ─── Initial migration: push all localStorage data once ── */
const MIGRATED_KEY = "dedi_supabase_migrated_v1";

export async function runMigrationIfNeeded() {
  if (localStorage.getItem(MIGRATED_KEY)) return;
  try {
    await forcePushAll();
    localStorage.setItem(MIGRATED_KEY, new Date().toISOString());
  } catch (e) {
    console.warn("Migration partial:", e);
  }
}

export { setCurrentUserId } from "./supabase";
