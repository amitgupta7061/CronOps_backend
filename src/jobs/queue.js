import { Queue } from 'bullmq';
import { createRedisConnection } from './redis.js';
import { logger } from '../utils/logger.js';

// Queue names
export const QUEUE_NAMES = {
  CRON_JOBS: 'cron-jobs',
};

// Create the main cron jobs queue
export const cronQueue = new Queue(QUEUE_NAMES.CRON_JOBS, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000,    // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

cronQueue.on('error', (error) => {
  logger.error('Queue error', { error: error.message });
});

logger.info('BullMQ Queue initialized', { queueName: QUEUE_NAMES.CRON_JOBS });

export default cronQueue;
