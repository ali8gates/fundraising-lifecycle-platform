import { Queue, Worker, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';

// BullMQ v5 requires maxRetriesPerRequest: null when using IORedis
const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

export const ingestQueueName = 'ingest';
export const ingestQueue = new Queue(ingestQueueName, { connection });

export function createWorker(handler: Parameters<typeof Worker>[1]) {
  return new Worker(ingestQueueName, handler, { connection });
}

export async function enqueue(name: string, data: unknown, opts?: JobsOptions) {
  await ingestQueue.add(name, data, opts);
}

