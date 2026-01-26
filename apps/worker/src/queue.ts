import { Queue, Worker, QueueScheduler, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379');

export const ingestQueueName = 'ingest';
export const ingestQueue = new Queue(ingestQueueName, { connection });
export const ingestScheduler = new QueueScheduler(ingestQueueName, { connection });

export function createWorker(handler: Parameters<typeof Worker>[1]) {
  return new Worker(ingestQueueName, handler, { connection });
}

export async function enqueue(name: string, data: unknown, opts?: JobsOptions) {
  await ingestQueue.add(name, data, opts);
}

