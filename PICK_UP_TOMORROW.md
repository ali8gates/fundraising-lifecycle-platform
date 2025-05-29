# Pick up tomorrow – CHTI Business Scouting Tool

**Project:** CHTI Business Scouting Tool (chti-innovators-network)  
**Repo:** `/Users/ali8gates/Documents/PythonProjects/chti-innovators-network`  
**Production URL:** https://chti-innovators-network.vercel.app

---

## Where things stand

- **Local:** App runs with `pnpm dev` at http://127.0.0.1:3001. Gate, sign out, AHA text, companies, dashboard all work after migrations + seed.
- **Vercel:** Builds are **failing** with `ERR_INVALID_THIS` during `pnpm install` because Vercel uses Node 20 and pnpm hits a known bug. Fix is to force **Node 18** on Vercel.

---

## Next step (to get production working)

**1. Set Node 18 in Vercel**

1. Go to [vercel.com](https://vercel.com) → **chti-innovators-network** project.
2. **Settings** → **Environment Variables**.
3. Add:
   - **Key:** `NODE_VERSION`
   - **Value:** `18`
   - **Environments:** Production + Preview (and Development if you use it).
4. Save.

**2. Redeploy**

- **Deployments** → open latest deployment → **⋯** → **Redeploy** (or push a new commit to `main`).

After that, the build should use Node 18 and complete; https://chti-innovators-network.vercel.app should then load.

---

## Vercel project settings (already configured)

- **Root Directory:** `apps/web`
- **Build Command:** `cd ../.. && pnpm --filter @chti/db prisma generate && pnpm --filter @chti/web build`
- **Install Command:** `cd ../.. && pnpm install`
- **Output Directory:** `.next`
- **Framework:** Next.js

---

## Useful commands (from repo root)

```bash
cd /Users/ali8gates/Documents/PythonProjects/chti-innovators-network

# Run app locally
pnpm dev

# DB migrations (if schema changes)
pnpm --filter @chti/db prisma migrate deploy
pnpm --filter @chti/db exec prisma generate

# Seed DB
pnpm prisma:seed

# Push to production (triggers Vercel deploy)
git add -A && git commit -m "Your message" && git push origin main
```

---

## Recent changes (for context)

- Product name: **CHTI Business Scouting Tool**
- Gate on every sign-in (session cookie), **Sign out** button top-right
- **American Heart Association** text only (no logo image) top-left
- Production URL: **https://chti-innovators-network.vercel.app**
- Node: `engines` `>=18.x` in package.json; `.nvmrc` with `18` at repo root and in `apps/web/`
- Gate page JSX indentation fixed; `apps/web/vercel.json` and `apps/web/.nvmrc` added for Vercel
- **Still needed:** `NODE_VERSION=18` in Vercel env vars so the build succeeds

---

## Docs in this repo

- **GETTING_STARTED.md** – First-time setup and daily run
- **VERCEL_DEPLOYMENT.md** – Full Vercel + DB + worker setup (includes NODE_VERSION=18)
- **README.md** – Overview, basic steps, production URL

Save this file in the repo so you can pick up from here tomorrow.
