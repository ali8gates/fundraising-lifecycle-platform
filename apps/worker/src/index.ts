import { createWorker, enqueue, ingestScheduler } from './queue';
import { runEnrichmentPipeline } from './jobs/enrichmentPipeline';

async function bootstrap() {
  // Worker to handle scheduled enrichment jobs
  createWorker(async (job) => {
    if (job.name === 'enrich') {
      await runEnrichmentPipeline();
    }
  });

  // Add a repeating job if not present
  await enqueue('enrich', {}, { repeat: { every: (Number(process.env.INGEST_INTERVAL_MINS ?? '30')) * 60 * 1000 } });
  await ingestScheduler.waitUntilReady();
  // Kick an immediate run on startup
  await enqueue('enrich', {});
  // eslint-disable-next-line no-console
  console.log('Worker started: enrichment pipeline scheduled');
}

bootstrap().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

