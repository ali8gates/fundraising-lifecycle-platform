# Start here, Fundraising Lifecycle Platform setup

This guide is in your project folder. Look for **GETTING_STARTED.md** in the main project folder (the same folder that has `package.json`, `apps/`, and `packages/`).

---

## 1. Open a terminal in the project folder

- **In your editor:** open a new terminal. If you’re not already in the project, run:
  ```bash
  cd /Users/ali8gates/Documents/PythonProjects/fundraising-lifecycle-platform
  ```
- You should see a path ending in `fundraising-lifecycle-platform`. That’s the **repo root**. All commands below are run from here.

---

## 2. First time only, install and set up the database

Run these one after another (copy-paste each block, press Enter, wait for it to finish):

**Install dependencies**
```bash
pnpm install
```

**Create the database** (only if you don’t have it yet).  
If `pnpm --filter @chti/db prisma migrate deploy` (below) already works, the database exists, **skip this step**.

- If PostgreSQL is installed via Homebrew, you may need to add it to your PATH, then run: `createdb chti`
- Or create the database using a GUI (e.g. Postico, pgAdmin) or `psql -U your_username -c "CREATE DATABASE chti;"`

**Apply database migrations**
```bash
pnpm --filter @chti/db prisma migrate deploy
```

**Generate the database client**
```bash
pnpm --filter @chti/db exec prisma generate
```

If migrations ran successfully earlier, your database is already set up. You can skip “Create the database” and go straight to “Start the app” (step 3) when you run the project again.

**Optional: add sample data** (includes one company “EchoPredict” that shows the AI Assessment Lab badge)
```bash
pnpm prisma:seed
```

**Environment file**  
If you don’t have a `.env` file yet, copy the example and edit it:
```bash
cp .env.example .env
```
Open `.env` and set at least:
- `DATABASE_URL` (e.g. `postgresql://YOUR_MAC_USERNAME@localhost:5432/chti?schema=public`)
- `REDIS_URL` (e.g. `redis://localhost:6379`)
- `APP_BASE_URL` (e.g. `http://localhost:3001`)

---

## 3. Start the app

From the **same project folder** (repo root):

```bash
pnpm dev
```

When it’s ready, open in your browser: **http://localhost:3001** or **http://127.0.0.1:3001**

To stop the app: press **Ctrl+C** in the terminal.

---

## 4. After you pull new code or someone changes the database

From the **repo root**:

```bash
pnpm apply-updates
```

Then stop the app (Ctrl+C) and start it again:

```bash
pnpm dev
```

Do a hard refresh in the browser: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows).

---

## Seeing AI Assessment Lab and “good fit” companies

- **One example company:** After running `pnpm prisma:seed`, a company named **EchoPredict** is created and should show the **AI Assessment Lab** badge (and possibly Innovators Network) on the Companies page.
- **More companies with badges:** To classify your real companies (from RSS ingest) as AI Assessment Lab or Innovators Network, run the **backfill** so the app scrapes their websites and recomputes fit. From the repo root:
  ```bash
  pnpm --filter @chti/worker exec tsx src/scripts/backfillFit.ts
  ```
- On the **Companies** page use **“Show: All companies”** to see every company and their current badges (including “Neither” for not-yet-classified). Use **“Show: Good fit only”** to see only companies that match at least one offering.

---

## Quick reference

| I want to…              | Do this (from repo root)      |
|-------------------------|-------------------------------|
| Run the app             | `pnpm dev`                    |
| Stop the app            | Ctrl+C in the terminal        |
| Apply DB/code updates   | `pnpm apply-updates` then `pnpm dev` |
| Open the app in browser | http://localhost:3001 or http://127.0.0.1:3001 |

**Repo root** = the folder that contains `package.json`, `apps/`, and `packages/` (e.g. `fundraising-lifecycle-platform`). Don’t run these commands from inside `packages/db` or `apps/web`.

---

## If you see “The column Company.innovatorsNetworkTier does not exist”

The database is missing some columns. Apply all migrations from the **repo root**:

```bash
cd /Users/ali8gates/Documents/PythonProjects/fundraising-lifecycle-platform
pnpm --filter @chti/db prisma migrate deploy
```

Then restart the app (`pnpm dev`) and refresh the page.
