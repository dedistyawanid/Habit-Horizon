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
- **Purpose**: A personal minimalist habit tracker for Dedi Styawan
- **Data storage**: Browser LocalStorage (no backend required)
- **Features**:
  - Personalized dashboard with greeting ("Halo, Dedi Styawan!") and daily motivation quote in Bahasa Indonesia
  - Performance Insight: Top Performing and Needs Attention habits
  - Add/Edit/Delete habits with Name, Category, Description, Frequency
  - Categories: Health, Work, Skill, Finance, Social, Personal, Other
  - Frequencies: Daily, Weekly, Monthly
  - Daily check-in toggle per habit
  - Per-habit notes for each check-in date
  - Monthly calendar recap (visual heatmap per habit)
  - Progress bars (monthly completion %)
  - Streak tracking
  - Grid / List view toggle
  - Filter by category, sort by name/performance/created date
  - Search bar
  - Export to CSV and JSON
  - Responsive design (mobile + desktop)
  - Soft violet/indigo color palette

### API Server (`artifacts/api-server`)
- **Type**: Express API
- **Preview path**: `/api`
- **Purpose**: Shared backend (currently only /healthz endpoint)

### Canvas / Mockup Sandbox (`artifacts/mockup-sandbox`)
- **Type**: Design sandbox
- **Preview path**: `/__mockup`
- **Purpose**: UI prototyping canvas
