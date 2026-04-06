# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Dedi's Habit Tracker (`artifacts/habit-tracker`)
- **Type**: React + Vite web app
- **Preview path**: `/`
- **Purpose**: Personal minimalist habit tracker for Dedi Styawan
- **Data storage**: Browser LocalStorage (offline-first) + Supabase cloud sync (multi-device)
- **Supabase project**: `dvhscmrnchajjxdjbfph.supabase.co`
- **Sync strategy**: All writes go to LocalStorage immediately; a background queue pushes changes to Supabase. On app mount, cloud data hydrates localStorage (cloud wins). Profile row in `profiles` table stores display_name, nutrition goals, target_weight, and `theme_selection` JSON (which embeds avatarUrl as a compressed base64 JPEG ≤220px).
- **Design system**: Earth-tone minimalist aesthetic. Cream body (`#FAF9F6`), white cards (`#FFFFFF`) with 1px warm border (`#E5E0D8`), 28px border radius, no shadows. Deep charcoal headings (`#2D2926`). BottomNav white glass `rgba(255,255,255,0.92)` + blur.

#### Features
- **Dashboard**: Personalized greeting, Hijri+Gregorian date display, today's reminders, habit list, performance stats
- **Habits**: CRUD with category/frequency/description/monthly target/weekly streak target; daily check-in toggle; confetti + fire icon on milestones
- **Habit History**: Calendar heatmap + bar chart (week-by-week breakdown) + key stats per habit
- **Bottom Navigation**: Fixed bottom nav with 5 tabs (Habits, Insights, Finance, Health, Notes)
- **Multi-action FAB**: Opens sub-menu with New Note, Finance Entry (navigates to Finance + auto-opens form), Quick Check-in
- **Swipe Gestures**: Swipe left/right on page content to switch tabs; visual bounce feedback on tab switch
- **Notes**: Full CRUD, markdown toolbar (Bold, Italic, List), full-screen writing mode, markdown preview in fullscreen, URL reference preview, reminder system (date picker + dashboard reminders section)
- **Finance Tracker**: Income/expense transactions, BCA/GoPay/etc account source, category filter, annual revenue target (default 1B IDR, editable in Settings > Data), cumulative chart
- **Insights**: Habit analytics, 3d/7d/30d/12m filters, per-habit breakdown
- **Health Tab** (`/health`): 3 sub-tabs (Activity / Nutrition / Body) with sticky blur pill nav.
  - **Activity**: Day/Week/Month period toggle; 4 stat cards + donut chart filtered by period; Log Activity form (Running/Badminton/Workout/Other, Trail/Road, auto-checks exercise habits); activity history
  - **Nutrition**: Today's Calorie + Protein progress bars; editable daily targets (pencil icon); "+ Log Meal" bottom-sheet modal (name, kcal, protein); daily food history list. LS keys: `dedi_nutrition_log`, `dedi_nutrition_targets`. Hook: `useNutritionLog`
  - **Body**: Current weight hero card; weight trend area chart (last 10); log weight input; weight history list (last 10)
- **Settings**:
  - Profile: name, weight, height, mission, avatar upload
  - Appearance: Light/Dark/System theme, 5 earth-tone accent presets: Sage & Charcoal `#556B2F` (default), Terracotta & Sand `#E2725B`, Deep Forest `#2D3A2D`, Autumn Ochre `#B8860B`, Stone & Slate `#4A4A4A`. Date format (DD/MM/YYYY etc.)
  - Categories: Add/rename/delete habit and note categories
  - Data: Edit annual revenue target, export JSON v3.1 (full backup incl. finance+weight+activity), export CSV, import JSON
- **Data Integrity**: All data (habits, check-ins, notes, transactions, financeSettings, weightLog, activityLog, settings) saved to LocalStorage and included in export/import v3.1

#### Key Files
- `src/App.tsx` — App shell, routing, header, swipe gestures, modals
- `src/context/AppContext.tsx` — Single React context for all app state
- `src/components/BottomNav.tsx` — Fixed bottom navigation with bounce feedback
- `src/components/MultiFAB.tsx` — Multi-action floating action button
- `src/components/HabitCard.tsx` — Habit card with 3-dot dropdown menu
- `src/components/MonthlyRecap.tsx` — Calendar + bar chart + stats per habit
- `src/components/QuickNoteModal.tsx` — Note editor with markdown, full-screen mode, reminder
- `src/components/SettingsModal.tsx` — Settings with accent gallery, annual target editor
- `src/hooks/useWeightLog.ts` — Weight entry LocalStorage hook (LS key: dedi_weight_log)
- `src/hooks/useActivityLog.ts` — Activity log LocalStorage hook (LS key: dedi_activity_log)
- `src/pages/HealthPage.tsx` — Health tab with weight chart + activity log + auto-habit check-in
- `src/hooks/useSwipeNav.ts` — Touch swipe detection for tab navigation (5 tabs)
- `src/lib/hijriDate.ts` — Hijri calendar conversion utility
- `src/lib/exportUtils.ts` — JSON/CSV export (all data points)
- `src/types/settings.ts` — `AccentTheme` type: `"sage"|"terracotta"|"forest"|"ochre"|"slate"`. 5 earth-tone presets. Migration logic in `useSettings.ts` auto-converts old names.
- `src/types/finance.ts` — Finance types (Transaction, FinanceSettings)

#### Security
- **Credentials**: Supabase URL + anon key are read exclusively from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` shared env vars (no hardcoded fallbacks)
- **User ID scoping**: `getUserId()` returns `""` when signed out (previously `"dedi"`); all write ops are gated behind `AuthGate` in App.tsx
- **Input sanitization**: `sanitizeInput(value, maxLength)` in `src/lib/utils.ts` strips HTML tags and limits length; applied to habit names, finance titles, meal names, activity locations
- **Note preview XSS**: `escapeHtml()` runs before markdown rendering in `QuickNoteModal.tsx`'s `renderPreview` to prevent `<script>` injection
- **Auth gate**: `if (!user) return <LoginPage />` in `AuthGate` (App.tsx) blocks all app content for unauthenticated sessions
- **RLS**: Supabase anon key is designed to be public; RLS policies must be enabled on the Supabase dashboard to scope data per user
- **Known warning**: `finance_settings` table not yet migrated in Supabase (console warning only, does not affect functionality)

### API Server (`artifacts/api-server`)
- **Type**: Express API
- **Preview path**: `/api`
- **Purpose**: Shared backend (currently only /healthz endpoint)

### Canvas / Mockup Sandbox (`artifacts/mockup-sandbox`)
- **Type**: Design sandbox
- **Preview path**: `/__mockup`
- **Purpose**: UI prototyping canvas
