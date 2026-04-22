# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web

# Lint
npm run lint

# Build for distribution (EAS)
npm run build:android:preview
npm run build:android:prod
```

There are no automated tests in this project.

## Environment Setup

API keys are loaded via `dotenv` in `app.config.js` and passed to the app through `expo-constants`.

Three env files exist — never commit any of them:

| File | Purpose |
|---|---|
| `.env` | Active config (what the app reads) |
| `.env.local` | Local Supabase credentials |
| `.env.prod` | Production Supabase credentials |

**Switch to local dev:**
```powershell
copy .env.local .env
```

**Switch back to production:**
```powershell
copy .env.prod .env
```

Required variables:
```
OPENROUTER_API_KEY=
PERPLEXITY_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

The active AI provider is toggled in `config/env.ts` via `aiProvider: 'perplexity' | 'openrouter'`. The current model for Perplexity is `sonar-pro`.

## Local Supabase Development

Local Supabase runs via Docker. The Supabase CLI is installed as a dev dependency (`npx supabase`).

**Start local DB:**
```powershell
npx supabase start
```

Outputs local credentials and Studio URL (`http://127.0.0.1:54323`).

**Stop local DB:**
```powershell
npx supabase stop
```

**Reset local DB** (re-applies all migrations + seed data):
```powershell
npx supabase db reset
```

**Create a new migration:**
```powershell
npx supabase migration new <name>
```

**Push migrations to production** (only when ready):
```powershell
npx supabase db push
```

The production project ref is `htlbsnlunwblpejilvjt`.

The Supabase access token must be set before CLI commands that talk to remote:
```powershell
$env:SUPABASE_ACCESS_TOKEN="<token>"
```

> Note: When testing on a physical Android device via Expo Go, the local Supabase URL must use the machine's LAN IP (e.g. `http://192.168.1.17:54321`), not `127.0.0.1`, because `127.0.0.1` resolves to the phone itself.

Migration files live in `supabase/migrations/`. The canonical schema is `20260410192130_remote_schema.sql` (pulled from production). Old migration files are archived in `supabase/migrations_backup/`.

## Architecture

### Routing (Expo Router file-based)

- `app/_layout.tsx` — Root layout. Wraps app in `AuthProvider` → `AppProvider` → `ThemeProvider`. Handles auth-gated navigation: unauthenticated users are redirected to `/onboarding/welcome`, authenticated users to `/(tabs)`.
- `app/(auth)/` — Login and signup screens
- `app/onboarding/` — Multi-step onboarding flow (welcome → user-info → dietary-preferences → goals → completion)
- `app/(tabs)/` — Main app tabs: Track (index), Stats (summary), Progress, History (explore). Profile and Settings tabs exist but are hidden from the tab bar.

### State Management

Two React contexts wrap the entire app:

**`AuthContext`** (`contexts/AuthContext.tsx`) — Manages Supabase auth session. Exposes `user`, `loading`, login/signup/logout functions.

**`AppContext`** (`contexts/AppContext.tsx`) — `useReducer`-based store for meals, settings, favorites, and animation settings. Syncs to Supabase on change (debounced 500ms). Force-saves when app goes to background. Clears state on logout. Access via `useApp()` hook.

### AI Nutrition Analysis Flow

`services/ai-service.ts` → `analyzeNutrition(mealText)`:
1. Check static USDA cache (`services/nutrition-cache.ts`)
2. Check API response cache in Supabase (`services/api-response-cache.ts`)
3. Queue request via `globalRequestQueue` (`services/request-queue.ts`) to prevent rate limiting
4. Call OpenRouter or Perplexity API
5. Save response to API cache

The main Track screen (`app/(tabs)/index.tsx`) is a free-text editor. Each line is debounced (1500ms) and independently analyzed. Calorie results overlay the right side of each line via absolute positioning. The animation progresses through states: `idle` → `calculating` → `sources` → `done`.

### Data Persistence

`services/database-service.ts` — All Supabase DB operations (meals, settings). Requires authenticated user; throws otherwise. Meals are stored per-user with timestamps; loaded/queried by date range.

`services/storage-service.ts` — Thin wrapper around `database-service` used by `AppContext`.

`services/favorites-service.ts` — CRUD for the `favorite_meals` table; tracks usage frequency.

### Theming

`constants/theme.ts` exports `Colors` (light/dark palettes). `constants/mockData.ts` exports `COLORS` (a different color set used in the Track screen) and `DEFAULT_SETTINGS`. The `useTheme()` hook returns `'light' | 'dark'` based on system color scheme.

### Key Component Patterns

- `AnimatedCalorieText` — Renders per-line calorie overlay with animation states and source circles
- `CalorieProgressBar` — Fixed bottom bar showing consumed vs. goal calories
- `NutritionDetailsModal` — Tappable modal for viewing/editing a meal's nutrition breakdown
- `FavoritesPanel` — Horizontal scroll of saved favorite meals for quick-add
- Auth components live in `components/auth/`

