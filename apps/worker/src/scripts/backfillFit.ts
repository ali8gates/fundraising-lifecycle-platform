/**
 * One-time backfill: recompute and persist fit for all companies.
 * Run from repo root: pnpm --filter @chti/worker exec tsx src/scripts/backfillFit.ts
 * Or from apps/worker: npx tsx src/scripts/backfillFit.ts
 */
import { runBackfillCompanyFits } from '../jobs/enrichmentPipeline.js';

runBackfillCompanyFits()
  .then(({ updated, errors }) => {
    console.log(`Backfill complete: ${updated} updated, ${errors} errors`);
    process.exit(errors > 0 ? 1 : 0);
  })
  .catch((e) => {
    console.error('Backfill failed:', e);
    process.exit(1);
  });
