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
- **Data storage**: Browser LocalStorage only (no backend required)
- **Default theme**: Sage & Charcoal — dark charcoal primary (#1F1F1F), off-white card surface (#F4F5F3), sage-to-mint gradient background (#A8C0B2→#DCE6E1), blue accent (#C9D5F5). Light mode default.

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
- **Health Tab** (`/health`): Weight Log (input + area chart + history), Activity Log (Running/Badminton/Gym with km+min fields), auto-checks matching exercise habits on activity log
- **Settings**:
  - Profile: name, weight, height, mission, avatar upload
  - Appearance: Light/Dark/System theme, 5 accent color presets (Sage Green default, Violet, Ocean, Sunset, Midnight), date format (DD/MM/YYYY etc.)
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
- `src/types/settings.ts` — Theme presets (forest=Sage Green as default)
- `src/types/finance.ts` — Finance types (Transaction, FinanceSettings)

### API Server (`artifacts/api-server`)
- **Type**: Express API
- **Preview path**: `/api`
- **Purpose**: Shared backend (currently only /healthz endpoint)

### Canvas / Mockup Sandbox (`artifacts/mockup-sandbox`)
- **Type**: Design sandbox
- **Preview path**: `/__mockup`
- **Purpose**: UI prototyping canvas
