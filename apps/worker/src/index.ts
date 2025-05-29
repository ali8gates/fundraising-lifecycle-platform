import { config } from 'dotenv';
import { resolve } from 'path';
import { createWorker, enqueue } from './queue.js';
import { runEnrichmentPipeline } from './jobs/enrichmentPipeline.js';

// Load .env from monorepo root so API keys are available when running from project root
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '../../.env') });

async function bootstrap() {
  // Worker to handle scheduled enrichment jobs (keep reference so process stays alive)
  const worker = createWorker(async (job) => {
    if (job.name === 'enrich') {
      console.log('Enrichment pipeline starting...');
      try {
        await runEnrichmentPipeline();
        console.log('Enrichment pipeline finished.');
      } catch (err) {
        console.error('Enrichment pipeline error:', err);
        throw err;
      }
    }
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });
  worker.on('failed', (job, err) => {
    console.error('Job failed:', job?.name, err?.message ?? err);
  });

  // Add a repeating job (BullMQ v5: every N ms). Default 1440 = daily real-time ingestion.
  const intervalMins = Number(process.env.INGEST_INTERVAL_MINS ?? '1440');
  const intervalMs = intervalMins * 60 * 1000;
  await enqueue('enrich', {}, { repeat: { every: intervalMs } });
  await enqueue('enrich', {});

  console.log(`Worker started: enrichment pipeline scheduled every ${intervalMins} min (${intervalMins >= 1440 ? 'daily' : `${Math.round(intervalMins / 60)}h`})`);

  // Run pipeline once immediately so you see output and Recent News gets data (BullMQ job may not run right away)
  console.log('Running enrichment pipeline once on startup...');
  try {
    await runEnrichmentPipeline();
    console.log('Startup pipeline run finished.');
  } catch (err) {
    console.error('Startup pipeline error:', err);
  }
}

bootstrap().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Bootstrap failed:', e?.message ?? e);
  if (e?.stack) console.error(e.stack);
  process.exit(1);
});

