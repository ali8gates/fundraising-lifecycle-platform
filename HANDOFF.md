# CHTI Business Scouting Tool: Handoff Guide

This document is the single starting point for anyone at AHA picking up this project. Other docs in this repo (`DEPLOY_STEPS.md`, `QUICK_DEPLOY.md`, `PRODUCTION_SETUP.md`, `VERCEL_DEPLOYMENT.md`, `GETTING_STARTED.md`, `WALKTHROUGH.md`, `RESUME-TOMORROW.md`, `PICK_UP_TOMORROW.md`, `LAUNCH_TONIGHT.md`, `GTM_LAUNCH_PLAN.md`) were working notes from active development and may be out of date. If something here conflicts with one of those, this file wins. Those older docs can be archived or removed once this one is confirmed accurate.

## What this is

An early-stage platform built for AHA's Innovators Network to:
- Pull in public healthcare startup news, filings, and funding data
- Sort that information by healthcare specialty
- Score candidate companies and move them through review stages
- Support outreach, meeting booking, and pipeline tracking

## Current status

- **Live and deployed**, not a prototype. Production URL: **https://chti-scout.com**
- Hosted on **Vercel**, currently 21 production deployments to date
- Protected by a gate page requiring a 7-digit access code before Dashboard, Companies, or Settings are visible (cookie persists 7 days after entry)
- Single contributor to date: Ali Gates

## Data and security posture

- **Public data only. No PHI is collected, stored, or processed.**
- Secrets are handled via environment variables; nothing is hardcoded into the codebase.
- Admin-only endpoints require an `x-admin-key` header matched against `ADMIN_API_KEY`.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| Backend | Next.js API routes + background worker (BullMQ) |
| Queue | Redis |
| Database | PostgreSQL + Prisma ORM |
| Search | Postgres filtering (full-text search ready, not yet enabled) |
| Tests | Vitest |
| Local packaging | Docker Compose (Postgres + Redis) or Homebrew services |

**Repo structure (monorepo):**
- `/apps/web`: Next.js application
- `/apps/worker`: BullMQ worker and scheduled jobs
- `/packages/db`: Prisma schema, client, and seed data
- `/packages/shared`: shared types and the scoring library

## Data sources

**Included, free:**
- RSS/Atom feeds (10 healthcare news sources set up by default)
- SEC EDGAR S-1 filings for healthcare companies
- A keyword and TF-IDF matching script that assigns each item a specialty

**Optional, paid, require their own API keys:**
- Crunchbase API (healthcare/medtech/biotech funding data)
- AngelList API (startup funding and investor signals)

The background job that pulls in and processes new data (`apps/worker/src/jobs/enrichmentPipeline.ts`) runs every 30 minutes by default. That interval can be changed with `INGEST_INTERVAL_MINS`.

## Running it locally

**First-time setup:**
1. Start PostgreSQL and Redis (e.g. `brew services start postgresql@16 redis`, then `createdb chti`)
2. From the repo root: `pnpm install`, then `pnpm --filter @chti/db prisma migrate deploy`, then `pnpm --filter @chti/db exec prisma generate`
3. Copy `.env.example` to `.env` and set `DATABASE_URL`, `REDIS_URL`, `APP_BASE_URL`
4. Optional: `pnpm prisma:seed` to populate seed data

**Day to day:**
- `pnpm dev` from the repo root, then open `http://localhost:3001`
- After pulling new code with schema changes: `pnpm apply-updates`, then restart the dev server

**Fastest path:** run `./launch.sh` from the repo root. It checks for pnpm, creates `.env` if missing, verifies Postgres/Redis are running, installs dependencies, generates the Prisma client, and starts the dev server.

## Environment variables

```
# Required
DATABASE_URL=postgresql://user@localhost:5432/chti?schema=public
REDIS_URL=redis://localhost:6379
APP_BASE_URL=http://localhost:3001   # production: https://chti-scout.com

# Admin
ADMIN_API_KEY=replace-with-strong-random

# Optional API keys
CRUNCHBASE_API_KEY=
ANGELLIST_API_KEY=

# Worker
INGEST_INTERVAL_MINS=30

# Gate access
GATE_ACCESS_CODE=   # 7-digit code; set CHTI_GATE_CODE as an alternate name if needed
```

## Production deployment (current setup)

The app currently deploys to Vercel:
1. Repo connected at vercel.com, root directory set to the repo root
2. Framework preset: Next.js; application directory `apps/web` if required
3. Environment variables set in Vercel project settings (same list as above, with production values)
4. Deploys trigger from the Vercel dashboard, or via `vercel --prod` from the repo root if the CLI is linked
5. Database migrations run once against production: `pnpm --filter @chti/db prisma migrate deploy` with `DATABASE_URL` pointed at the production database

## What AHA's team needs to decide before taking this over

This is the part that matters most for a clean handoff, and it's worth working through together rather than assuming:

1. **Hosting ownership.** The Vercel project and the `chti-scout.com` domain are currently tied to my personal accounts. AHA will need to either take over that Vercel project directly or redeploy the codebase under an AHA-owned Vercel account and domain.
2. **Database ownership.** The production Postgres database is currently on infrastructure I set up. AHA's team should decide whether to migrate the existing data to AHA-managed infrastructure or start fresh.
3. **Secrets rotation.** Since I built and ran this personally, all secrets (`ADMIN_API_KEY`, `GATE_ACCESS_CODE`, database credentials, any API keys in use) should be rotated once AHA takes ownership, as a basic security practice, not because of any specific concern.
4. **Paid API keys.** If Crunchbase or AngelList integrations are wanted going forward, AHA will need its own API keys under an AHA account; mine won't transfer.
5. **GitHub access.** This repo is currently private under my personal GitHub account. AHA will need either to be added as a collaborator or to have the repo transferred/forked into an AHA-owned GitHub organization.

## Data model (Prisma)

Core entities: `Company`, `Signal`, `ScoreSnapshot`, `OutreachEvent`, `Meeting`, `Connector`, `User`, `AppConfig`

## Tests

- `pnpm test` runs the suite
- Unit tests cover scoring normalization (`packages/shared/tests/scoring.test.ts`)
- Ingestion tests cover the RSS parser (`apps/worker/tests/rss-transform.test.ts`)

## Questions

I'm happy to walk through any of this live, whatever's most useful, a working session, a recorded walkthrough, or just async Q&A as your team gets oriented.
