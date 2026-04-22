# Setup

How to get this project running after cloning. No env files are in git — you create them locally.

## 1. Prerequisites

- Node.js 18+ and npm
- Expo CLI (bundled via `npx expo`, no global install needed)
- Docker Desktop (only if you want to run Supabase locally)
- Android Studio / Xcode if building natively (optional — Expo Go works for most dev)

## 2. Install dependencies

```powershell
npm install
```

## 3. Create your env files

The app reads from a single `.env` file. You keep one or two source-of-truth files alongside it and copy whichever one you want active.

Create these three files at the repo root (none of them will be committed — `.gitignore` blocks all `.env.*`):

### `.env.local` — for local Supabase development

```env
AI_PROVIDER=perplexity
OPENROUTER_API_KEY=<your key>
OPENROUTER_MODEL=google/gemini-flash-1.5
PERPLEXITY_API_KEY=<your key>
PERPLEXITY_MODEL=sonar-pro
DEBUG_MODE=true
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<printed by "npx supabase start">
```

Fill `SUPABASE_URL` and `SUPABASE_ANON_KEY` with values from the output of `npx supabase start`. If you're testing on a physical Android device via Expo Go, replace `127.0.0.1` with your machine's LAN IP (e.g. `http://192.168.1.17:54321`) — the phone can't reach `127.0.0.1` on your laptop.

### `.env.prod` — for production Supabase

Same template as `.env.local`, but with production values:

```env
AI_PROVIDER=perplexity
OPENROUTER_API_KEY=<your key>
OPENROUTER_MODEL=google/gemini-flash-1.5
PERPLEXITY_API_KEY=<your key>
PERPLEXITY_MODEL=sonar-pro
DEBUG_MODE=false
SUPABASE_URL=<project URL from Supabase dashboard>
SUPABASE_ANON_KEY=<anon key from Supabase dashboard>
```

### `.env` — the active config

Don't fill this one by hand. Pick which environment you want active:

```powershell
# Use local Supabase
copy .env.local .env

# Use production Supabase
copy .env.prod .env
```

Re-run the copy whenever you switch.

## 4. Where to get the keys

| Credential | Where |
|---|---|
| `PERPLEXITY_API_KEY` | https://www.perplexity.ai/settings/api |
| `OPENROUTER_API_KEY` | https://openrouter.ai/keys |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` (prod) | Supabase dashboard → project `htlbsnlunwblpejilvjt` → Settings → API |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` (local) | Printed in the terminal when you run `npx supabase start` |

See `.env.example` for a commented template with tier info.

## 5. Local Supabase (optional)

If you picked the local env, start the database:

```powershell
npx supabase start
```

This boots Postgres + the Supabase stack in Docker and prints URLs (Studio is at http://127.0.0.1:54323). To stop: `npx supabase stop`. To reset the schema: `npx supabase db reset`.

## 6. Run the app

```powershell
npm start              # dev server with QR for Expo Go
npm run android        # build + launch Android
npm run ios            # build + launch iOS (macOS only)
npm run web            # web build
```

## Reference

- Build commands, Supabase CLI usage, and architecture notes: `CLAUDE.md`.
- Env variable reference: `.env.example`.
