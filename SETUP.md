# Setup

How to get this project running after cloning. No env files are in git — you create them locally.

## 1. Prerequisites

- Node.js 18+ and npm (skip if you go the Docker route in section 7)
- Expo CLI (bundled via `npx expo`, no global install needed)
- Docker Desktop (required for local Supabase and for the Docker dev stack in section 7)
- Android Studio / Xcode if building natively (optional — Expo Go works for most dev)
- The Expo Go app on your phone if you want to test on a real device

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

If you plan to run Metro via Docker (section 7), also add this line so Expo Go on your phone can find the bundler running inside the container:

```env
HOST_LAN_IP=192.168.1.17   # replace with YOUR machine's LAN IP
```

Find it with `ipconfig` on Windows (look for IPv4 under your active adapter) or `ifconfig` / `ip addr` on macOS/Linux.

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

## 6. Run the app (native workflow)

```powershell
npm start              # dev server with QR for Expo Go
npm run android        # build + launch Android
npm run ios            # build + launch iOS (macOS only)
npm run web            # web build
```

## 7. Run the app (Docker workflow)

Use this if you want a zero-install dev environment: no Node, no npm install, no Expo CLI on your host — just Docker.

**What runs where:** Metro bundler runs inside Docker (`docker-compose.yml`). The Supabase stack is managed by its own CLI (`npx supabase start` — it already uses Docker internally, ~20 containers). Your phone connects to Metro over your LAN via Expo Go.

**Important caveat:** native Android/iOS builds (`expo run:android`, `expo run:ios`, `eas build`) cannot run in Docker — they need the host SDK toolchains. Docker handles the JS dev loop only. For native builds stick to the section 6 workflow.

### Prereqs for Docker workflow

- Docker Desktop running
- `.env` populated (section 3), including the `HOST_LAN_IP` line
- Phone on the same Wi-Fi network as the host machine
- Expo Go installed on the phone

### Boot the stack

Two commands — one for the database, one for Metro:

```powershell
# Terminal 1 — starts local Supabase (only needed if .env points to local)
npx supabase start

# Terminal 2 — builds the Metro image on first run, then starts it
docker compose up
```

On the first `docker compose up` Docker will build the image (installs npm deps inside the container — takes a minute). Subsequent runs are instant.

Once Metro prints the QR, scan it with Expo Go. The phone connects to `<HOST_LAN_IP>:8081` and pulls the JS bundle.

### Common operations

```powershell
docker compose up -d           # run Metro detached (background)
docker compose logs -f metro   # tail Metro logs
docker compose down            # stop Metro
docker compose build --no-cache metro   # rebuild after package.json changes
```

After adding a dependency to `package.json`, rebuild so the container's `node_modules` volume picks it up: `docker compose build metro && docker compose up`.

### Troubleshooting

- **Expo Go can't connect / "Something went wrong"** — the phone can't reach `HOST_LAN_IP:8081`. Verify the IP is your host's LAN IP (`ipconfig`), the phone is on the same Wi-Fi, and your firewall isn't blocking port 8081.
- **File changes not triggering reload** — polling is already enabled (`CHOKIDAR_USEPOLLING=true`). If it's still flaky, restart the container: `docker compose restart metro`.
- **Supabase URL from the phone** — if you're using local Supabase, `SUPABASE_URL` in `.env` must also point to the LAN IP (`http://192.168.1.17:54321`), not `127.0.0.1`. The phone doesn't go through Docker for Supabase — it talks to the CLI-managed Supabase stack directly via the host's LAN IP.

## Reference

- Build commands, Supabase CLI usage, and architecture notes: `CLAUDE.md`.
- Env variable reference: `.env.example`.
