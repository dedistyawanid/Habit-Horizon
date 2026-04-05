/**
 * One-time migration script — creates all Supabase tables.
 * Run with: node scripts/supabase-migrate.mjs
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dvhscmrnchajjxdjbfph.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2aHNjbXJuY2hhamp4ZGpiZnBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM1Njg5NywiZXhwIjoyMDkwOTMyODk3fQ.kOQNGGoCXigxfxIJraiw8N5ExlVbDRTKsMNHp77KZTI";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const SQL = `
-- Extension for UUID generation
create extension if not exists "pgcrypto";

-- ── habits ──────────────────────────────────────────────────
create table if not exists habits (
  id            text primary key,
  user_id       text not null default 'dedi',
  name          text not null,
  category      text,
  frequency     text default 'Daily',
  color         text,
  icon          text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── checkins ────────────────────────────────────────────────
create table if not exists checkins (
  id            text primary key,
  user_id       text not null default 'dedi',
  habit_id      text not null references habits(id) on delete cascade,
  date          text not null,
  created_at    timestamptz default now()
);

-- ── finance_logs ─────────────────────────────────────────────
create table if not exists finance_logs (
  id            text primary key,
  user_id       text not null default 'dedi',
  type          text not null,
  amount        numeric not null,
  category      text,
  date          text not null,
  note          text,
  created_at    timestamptz default now()
);

-- ── notes ───────────────────────────────────────────────────
create table if not exists notes (
  id            text primary key,
  user_id       text not null default 'dedi',
  title         text not null,
  content       text,
  category      text,
  updated_at    timestamptz default now(),
  created_at    timestamptz default now()
);

-- ── activity_logs ────────────────────────────────────────────
create table if not exists activity_logs (
  id            text primary key,
  user_id       text not null default 'dedi',
  date          text not null,
  type          text not null,
  duration_min  numeric,
  distance_km   numeric,
  elevation_gain numeric,
  run_type      text,
  notes         text,
  created_at    timestamptz default now()
);

-- ── nutrition_logs ───────────────────────────────────────────
create table if not exists nutrition_logs (
  id            text primary key,
  user_id       text not null default 'dedi',
  date          text not null,
  name          text not null,
  calories      numeric not null default 0,
  protein       numeric not null default 0,
  carbs         numeric not null default 0,
  created_at    timestamptz default now()
);

-- ── sleep_logs ───────────────────────────────────────────────
create table if not exists sleep_logs (
  id            text primary key,
  user_id       text not null default 'dedi',
  date          text not null,
  hours         numeric not null,
  minutes       numeric not null default 0,
  quality       integer not null default 3,
  created_at    timestamptz default now()
);

-- ── weight_logs ──────────────────────────────────────────────
create table if not exists weight_logs (
  id            text primary key,
  user_id       text not null default 'dedi',
  date          text not null,
  weight        numeric not null,
  created_at    timestamptz default now()
);

-- ── Disable RLS (personal tracker, no auth) ─────────────────
alter table habits          disable row level security;
alter table checkins        disable row level security;
alter table finance_logs    disable row level security;
alter table notes           disable row level security;
alter table activity_logs   disable row level security;
alter table nutrition_logs  disable row level security;
alter table sleep_logs      disable row level security;
alter table weight_logs     disable row level security;
`;

async function migrate() {
  console.log("Running Supabase migration…");
  const { error } = await supabase.rpc("exec_sql", { sql: SQL }).catch(() => ({ error: "rpc_not_available" }));

  if (error) {
    // Fallback: split by statement and execute each via REST
    const statements = SQL.split(";").map((s) => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ sql: stmt + ";" }),
      });
      if (!res.ok) {
        const text = await res.text();
        if (!text.includes("already exists")) {
          console.warn("Statement warning:", text.slice(0, 120));
        }
      }
    }
  }

  console.log("Migration complete.");
}

migrate().catch(console.error);
