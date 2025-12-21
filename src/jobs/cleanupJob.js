import { Queue } from 'bullmq';
import { createRedisConnection } from './redis.js';
import { logger } from '../utils/logger.js';
import prisma from '../prisma/client.js';

// Queue name for cleanup jobs
export const CLEANUP_QUEUE_NAME = 'cleanup-jobs';

// Create the cleanup queue
export const cleanupQueue = new Queue(CLEANUP_QUEUE_NAME, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
  },
});

/**
 * Delete execution logs older than specified days
 */
async function deleteOldExecutionLogs(daysToKeep = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.executionLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}

/**
 * Initialize the cleanup job scheduler
 * Runs daily at 3 AM to clean up old execution logs
 */
export async function initializeCleanupJob() {
  try {
    // Remove any existing cleanup jobs first
    const existingJobs = await cleanupQueue.getRepeatableJobs();
    for (const job of existingJobs) {
      await cleanupQueue.removeRepeatableByKey(job.key);
    }

    // Schedule daily cleanup at 3 AM
    await cleanupQueue.add(
      'cleanup-old-logs',
      { daysToKeep: 30 },
      {
        repeat: {
          pattern: '0 3 * * *', // Every day at 3:00 AM
          tz: 'UTC',
        },
        jobId: 'daily-cleanup',
      }
    );

    logger.info('Cleanup job scheduled: daily at 3:00 AM UTC');
  } catch (error) {
    logger.error('Failed to initialize cleanup job', { error: error.message });
  }
}

/**
 * Process cleanup job (called by worker)
 */
export async function processCleanupJob(job) {
  const { daysToKeep = 30 } = job.data;
  
  logger.info('Starting cleanup job', { daysToKeep });
  
  const deletedCount = await deleteOldExecutionLogs(daysToKeep);
  
  logger.info('Cleanup job completed', { deletedCount, daysToKeep });
  
  return { deletedCount };
}

export default {
  cleanupQueue,
  initializeCleanupJob,
  processCleanupJob,
};
