# CHTI Business Scouting Tool (MVP)

**New here?** → See **[GETTING_STARTED.md](./GETTING_STARTED.md)** for step-by-step setup and where to run commands.

An MVP platform for AHA's Innovators Network to ingest public healthcare startup signals, auto-categorize by specialty, score and gate candidates, and support outreach + meeting booking + pipeline tracking.

## Tech
- Frontend: Next.js 14 (App Router), TypeScript, TailwindCSS
- Backend: Next.js API routes + background worker (BullMQ)
- Queue: Redis
- DB: PostgreSQL + Prisma ORM
- Search: Postgres basic filtering (FTS-ready)
- Tests: Vitest
- Packaging: Docker Compose (Postgres + Redis) or Homebrew services
- Lint/format: ESLint, Prettier

## Monorepo
- `/apps/web` — Next.js app
- `/apps/worker` — BullMQ worker and cron jobs
- `/packages/db` — Prisma schema, client, seed
- `/packages/shared` — shared types, scoring lib

## Data Sources

### Included (Free)
- **RSS/Atom Feeds** (10 healthcare news sources seeded)
- **SEC EDGAR** – S-1 IPO filings for healthcare companies
- **Keyword + TF-IDF classifier** – auto-assigns specialties to signals

### Optional (Paid APIs)
- **Crunchbase API** – healthcare, medtech, biotech industries + funding data
- **AngelList API** – startup funding and investor signals

### Setup Instructions
1. **RSS Feeds**: Configured by default; manage in Settings → RSS/Atom Feeds
2. **Crunchbase**: 
   - Get API key from [https://about.crunchbase.com/products/crunchbase-api/](https://about.crunchbase.com/products/crunchbase-api/)
   - Add to `.env`: `CRUNCHBASE_API_KEY=your_key`
3. **AngelList**: 
   - Register at [https://angel.co](https://angel.co) for API access
   - Add to `.env`: `ANGELLIST_API_KEY=your_key`
4. Restart the worker: `pkill -f "ts-node src/index.ts"; pnpm --filter @chti/worker dev`

The enrichment pipeline (in `apps/worker/src/jobs/enrichmentPipeline.ts`) runs every 30 mins (configurable via `INGEST_INTERVAL_MINS`).

## Basic steps

**First-time setup (once per machine)**  
1. Start PostgreSQL and Redis (e.g. `brew services start postgresql@16 redis` and `createdb chti`).  
2. From the **repo root**: `pnpm install` → `pnpm --filter @chti/db prisma migrate deploy` → `pnpm --filter @chti/db exec prisma generate` → `pnpm prisma:seed` (optional).  
3. Copy `.env.example` to `.env` and set `DATABASE_URL`, `REDIS_URL`, `APP_BASE_URL`.

**Run the app (daily)**  
1. From the **repo root**: `pnpm dev`.  
2. Open **http://localhost:3001**.

**After pulling new code (migrations or schema changes)**  
1. From the **repo root**: `pnpm apply-updates` (or `prisma migrate deploy` + `prisma generate` in `@chti/db`).  
2. Restart the dev server (Ctrl+C, then `pnpm dev`).  
3. Hard-refresh the browser (Cmd+Shift+R or Ctrl+Shift+R).

---

## Quick Start

### Easy Launch (Recommended)
```bash
# Simply run the launch script
./launch.sh
```

The script will:
- Check and set up pnpm if needed
- Create .env from .env.example if missing
- Check if PostgreSQL and Redis are running
- Install dependencies if needed
- Generate Prisma client if needed
- Start the development server

Then open: **http://localhost:3001**

### Manual Setup (macOS with Homebrew)
```bash
# Start services
brew install postgresql@16 redis
brew services start postgresql@16
brew services start redis
createdb chti

# Install & run
cd /Users/ali8gates/Documents/PythonProjects/chti-innovators-network
cp .env.example .env
sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=postgresql://$(id -un)@localhost:5432/chti?schema=public|" .env
corepack enable
corepack prepare pnpm@9.0.0 --activate
pnpm install
pnpm --filter @chti/db prisma generate
pnpm --filter @chti/db prisma migrate deploy
pnpm prisma:seed
pnpm dev
```

Then open: **http://localhost:3001**

### Seeing code/DB updates on localhost
If you pulled new code (e.g. AI Assessment Lab badges, enriched web text) and don’t see changes:

1. **Apply DB migrations and regenerate Prisma client** — run from the **repo root** (not from `packages/db`):
   ```bash
   cd /path/to/chti-innovators-network   # repo root
   pnpm apply-updates
   ```
   Or manually (from repo root):
   ```bash
   pnpm --filter @chti/db prisma migrate deploy
   pnpm --filter @chti/db exec prisma generate
   ```

2. **Restart the dev server**  
   Stop the running `pnpm dev` (Ctrl+C), then start it again:
   ```bash
   pnpm dev
   ```

3. **(Optional) Re-classify existing companies** (scrape websites and recompute fit):
   ```bash
   pnpm --filter @chti/worker exec tsx src/scripts/backfillFit.ts
   ```

Then hard-refresh the app (e.g. Cmd+Shift+R or Ctrl+Shift+R) or open **http://localhost:3001/companies** again.

### Docker
```bash
docker-compose up -d
pnpm install
pnpm --filter @chti/db prisma migrate deploy
pnpm prisma:seed
pnpm dev
```

### Security layer (gate)
On **localhost** and **production**, CHTI Business Scouting Tool shows a **gate page** first: visitors must enter a 7-digit access code before seeing Dashboard, Companies, or Settings. The gate is enforced by middleware; after a valid code, a cookie is set for 7 days.  
- **Default code** (change in production): set `GATE_ACCESS_CODE` or `CHTI_GATE_CODE` in `.env` or your host’s env (e.g. Vercel).  
- **Local:** Open **http://localhost:3001** or **http://127.0.0.1:3001** — you’ll be redirected to `/gate` until you enter the code.

---

## Push to production

**Production URL:** **https://chti-scout.com** — Add the domain in Vercel (Project Settings → Domains) and point your DNS to Vercel; set `APP_BASE_URL=https://chti-scout.com` in production env.

1. **Push your branch to GitHub** (from repo root):
   ```bash
   git add -A && git commit -m "Your message" && git push origin YOUR_BRANCH
   ```

2. **Deploy** (depends on your host):
   - **Vercel:** Connect the repo at [vercel.com](https://vercel.com). Set **Root Directory** to the repo root; set **Framework Preset** to Next.js and **Application (app) directory** to `apps/web` if required. Add env vars (e.g. `DATABASE_URL`, `REDIS_URL`, `APP_BASE_URL`, `GATE_ACCESS_CODE`). Trigger a deploy from the dashboard or via `vercel --prod` from the repo root (if Vercel CLI is linked).
   - **Other hosts:** Build with `pnpm build` (from root), then run the output (e.g. `pnpm --filter @chti/web start` from root after build). Set the same env vars and run DB migrations on the production DB.

3. **Production env vars:** At least `DATABASE_URL`, `REDIS_URL`, `APP_BASE_URL` (your production URL). Set `GATE_ACCESS_CODE` to a secure 7-digit code so the security layer works in production.

4. **Database:** Run migrations against the production DB once:  
   `pnpm --filter @chti/db prisma migrate deploy` (with `DATABASE_URL` pointing at production).

## Acceptance Checklist (MVP)
- ✓ Add RSS feeds in Settings; worker ingests and Signals appear.
- ✓ New companies auto-created from novel domains with auto-classified specialties.
- ✓ Scores computed with editable weights; stage gates move automatically.
- ✓ Search/filter companies by specialty and score.
- ✓ Log outreach, schedule a meeting, and download ICS.
- ✓ Dashboard shows core KPIs (stage breakdown, weekly signals, avg score).
- ✓ Integrate external data sources (Crunchbase, AngelList, SEC, RSS).

## Data Model (Prisma)
- `Company`, `Signal`, `ScoreSnapshot`, `OutreachEvent`, `Meeting`, `Connector`, `User`, `AppConfig`

## Assumptions
- Role-based access via `ADMIN_API_KEY` header on admin routes (simple, no PHI).
- Specialty classification uses keywords + TF-IDF cosine similarity (in-memory); hook provided to swap in LLM later.
- Postgres full-text search can be enabled later; MVP uses indexed columns and ILIKE filtering.
- ICS generated server-side; Google/Outlook links constructed as URLs.
- External APIs are optional; RSS and SEC sources are always free.

## Environment Variables
```bash
# Required
DATABASE_URL=postgresql://user@localhost:5432/chti?schema=public
REDIS_URL=redis://localhost:6379
APP_BASE_URL=http://localhost:3001   # production: https://chti-scout.com

# Admin
ADMIN_API_KEY=replace-with-strong-random

# Optional API Keys
CRUNCHBASE_API_KEY=
ANGELLIST_API_KEY=

# Worker
INGEST_INTERVAL_MINS=30
```

## Scripts
- `pnpm dev` → web and worker
- `pnpm --filter @chti/web dev -p 3001` → web only
- `pnpm --filter @chti/worker dev` → worker only
- `pnpm prisma:migrate` → run pending migrations
- `pnpm prisma:seed` → populate seed data

## Tests
- Unit: scoring normalization and weighted total (`packages/shared/tests/scoring.test.ts`)
- Ingestion: RSS parser transforms to Signal shape (`apps/worker/tests/rss-transform.test.ts`)

Run: `pnpm test`

## Security
- Public data only; no PHI
- Secrets via env; nothing hardcoded
- Admin-only endpoints require `x-admin-key: $ADMIN_API_KEY`

---

For connector code, see `/apps/worker/src/connectors` (rss.ts, crunchbase.ts, angellist.ts, sec.ts).
For enrichment pipeline, see `/apps/worker/src/jobs/enrichmentPipeline.ts`.
For seeds, see `/packages/db/src/seed.ts`.

