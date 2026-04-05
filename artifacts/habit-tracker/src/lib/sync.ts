/**
 * Sync layer — fire-and-forget upsert/delete helpers.
 * Each function returns a promise that resolves silently on success
 * and queues failed operations for offline retry.
 */
import { supabase, USER_ID } from "./supabase";

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
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q.filter((x) => !(x.table === x.table && x.id === id))));
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
    if (error) enqueue({ table, op: "upsert", id: row.id as string, row, ts: Date.now() });
    else dequeue(table, row.id as string);
  } catch { enqueue({ table, op: "upsert", id: row.id as string, row, ts: Date.now() }); }
}

async function del(table: string, id: string) {
  try {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) enqueue({ table, op: "delete", id, ts: Date.now() });
    else dequeue(table, id);
  } catch { enqueue({ table, op: "delete", id, ts: Date.now() }); }
}

/* ─── Habits ─────────────────────────────────────────────── */
export function syncHabit(h: { id: string; name: string; category?: string; frequency?: string; color?: string; icon?: string; createdAt?: string; weeklyStreakTarget?: number; targetDays?: number[] }) {
  return upsert("habits", { id: h.id, user_id: USER_ID, name: h.name, category: h.category ?? null, frequency: h.frequency ?? "Daily", color: h.color ?? null, icon: h.icon ?? null, created_at: h.createdAt ?? new Date().toISOString(), weekly_streak_target: h.weeklyStreakTarget ?? null, target_days: h.targetDays ? JSON.stringify(h.targetDays) : null });
}
export function deleteHabit(id: string) { return del("habits", id); }

export function syncCheckIn(c: { id: string; habitId: string; date: string; notes?: string; completedAt?: string }) {
  return upsert("checkins", { id: c.id, user_id: USER_ID, habit_id: c.habitId, date: c.date, notes: c.notes ?? null, completed_at: c.completedAt ?? new Date().toISOString() });
}
export function deleteCheckIn(id: string) { return del("checkins", id); }

/* ─── Activity ───────────────────────────────────────────── */
export function syncActivity(e: { id: string; date: string; type: string; durationMin?: number; distanceKm?: number; elevationGain?: number; runType?: string; notes?: string; createdAt?: string }) {
  return upsert("activity_logs", { id: e.id, user_id: USER_ID, date: e.date, type: e.type, duration_min: e.durationMin ?? null, distance_km: e.distanceKm ?? null, elevation_gain: e.elevationGain ?? null, run_type: e.runType ?? null, notes: e.notes ?? null, created_at: e.createdAt ?? new Date().toISOString() });
}
export function deleteActivity(id: string) { return del("activity_logs", id); }

/* ─── Nutrition ──────────────────────────────────────────── */
export function syncMeal(e: { id: string; date: string; name: string; calories: number; protein: number; carbs?: number; createdAt?: string }) {
  return upsert("nutrition_logs", { id: e.id, user_id: USER_ID, date: e.date, name: e.name, calories: e.calories, protein: e.protein, carbs: e.carbs ?? 0, created_at: e.createdAt ?? new Date().toISOString() });
}
export function deleteMeal(id: string) { return del("nutrition_logs", id); }

/* ─── Sleep ──────────────────────────────────────────────── */
export function syncSleep(e: { id: string; date: string; hours: number; minutes: number; quality: number; createdAt?: string }) {
  return upsert("sleep_logs", { id: e.id, user_id: USER_ID, date: e.date, hours: e.hours, minutes: e.minutes, quality: e.quality, created_at: e.createdAt ?? new Date().toISOString() });
}
export function deleteSleep(id: string) { return del("sleep_logs", id); }

/* ─── Weight ─────────────────────────────────────────────── */
export function syncWeight(e: { id: string; date: string; weight: number }) {
  return upsert("weight_logs", { id: e.id, user_id: USER_ID, date: e.date, weight: e.weight, created_at: new Date().toISOString() });
}
export function deleteWeight(id: string) { return del("weight_logs", id); }

/* ─── Finance ────────────────────────────────────────────── */
export function syncTransaction(t: { id: string; type: string; amount: number; category?: string; date: string; title?: string; note?: string; notes?: string; createdAt?: string }) {
  return upsert("finance_logs", { id: t.id, user_id: USER_ID, type: t.type, amount: t.amount, category: t.category ?? null, date: t.date, note: t.note ?? t.notes ?? t.title ?? null, created_at: t.createdAt ?? new Date().toISOString() });
}
export function deleteTransaction(id: string) { return del("finance_logs", id); }

/* ─── Notes ──────────────────────────────────────────────── */
export function syncNote(n: { id: string; title: string; content?: string; category?: string; createdAt?: string; updatedAt?: string }) {
  return upsert("notes", { id: n.id, user_id: USER_ID, title: n.title, content: n.content ?? null, category: n.category ?? null, created_at: n.createdAt ?? new Date().toISOString(), updated_at: n.updatedAt ?? new Date().toISOString() });
}
export function deleteNote(id: string) { return del("notes", id); }

/* ─── Initial migration: push all localStorage data once ── */
const MIGRATED_KEY = "dedi_supabase_migrated_v1";

export async function runMigrationIfNeeded() {
  if (localStorage.getItem(MIGRATED_KEY)) return;
  try {
    // habits
    const habits = JSON.parse(localStorage.getItem("dedi_habits") ?? "[]");
    for (const h of habits) await syncHabit(h);
    // checkins
    const checkins = JSON.parse(localStorage.getItem("dedi_checkins") ?? "[]");
    for (const c of checkins) await syncCheckIn(c);
    // activity
    const acts = JSON.parse(localStorage.getItem("dedi_activity_log") ?? "[]");
    for (const a of acts) await syncActivity(a);
    // nutrition
    const meals = JSON.parse(localStorage.getItem("dedi_nutrition_log") ?? "[]");
    for (const m of meals) await syncMeal(m);
    // sleep
    const sleeps = JSON.parse(localStorage.getItem("dedi_sleep_log") ?? "[]");
    for (const s of sleeps) await syncSleep(s);
    // weight
    const weights = JSON.parse(localStorage.getItem("dedi_weight_log") ?? "[]");
    for (const w of weights) await syncWeight(w);
    // finance
    const txns = JSON.parse(localStorage.getItem("dedi_transactions") ?? "[]");
    for (const t of txns) await syncTransaction(t);
    // notes
    const notes = JSON.parse(localStorage.getItem("dedi_quick_notes") ?? "[]");
    for (const n of notes) await syncNote(n);

    localStorage.setItem(MIGRATED_KEY, new Date().toISOString());
  } catch (e) {
    console.warn("Migration partial:", e);
  }
}
