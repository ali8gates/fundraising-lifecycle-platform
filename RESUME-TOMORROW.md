# CHTI Business Scouting Tool Pilot – Resume Tomorrow

**Where you left off:** You got the web app running and the database seeded. The worker was updated (BullMQ Redis option fixed, tsx for dev). You can pick up from here tomorrow.

---

## Quick start (when you’re back)

1. **Terminal 1 – Web app**
   ```bash
   cd /Users/ali8gates/Documents/PythonProjects/chti-innovators-network
   ./launch.sh
   ```
   Then open **http://localhost:3000**

2. **Terminal 2 – Worker** (pulls real data from APIs)
   ```bash
   cd /Users/ali8gates/Documents/PythonProjects/chti-innovators-network
   pnpm --filter @chti/worker dev
   ```
   You should see “Worker started: enrichment pipeline scheduled” and then RSS/SEC/API log lines.

3. **Check**
   - **http://localhost:3000/settings** – API keys should show ✓ Configured
   - **http://localhost:3000/companies** – Companies/signals after the worker runs once

---

## If the worker still errors

- **Redis:** `brew services start redis`
- **BullMQ “maxRetriesPerRequest”:** Already fixed in `apps/worker/src/queue.ts` (connection uses `maxRetriesPerRequest: null`).
- **Other:** Paste the full error and we can fix it.

---

## Reference

- **Project:** `/Users/ali8gates/Documents/PythonProjects/chti-innovators-network`
- **Full walkthrough:** `WALKTHROUGH.md`
- **API setup:** `.env` in project root (API keys already added)
- **Database:** PostgreSQL `chti`, user `ali8gates`; Redis for the worker

Save this file and reopen it tomorrow to resume.
