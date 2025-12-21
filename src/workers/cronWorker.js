import 'dotenv/config';
import { Worker } from 'bullmq';
import axios from 'axios';
import { createRedisConnection } from '../jobs/redis.js';
import { QUEUE_NAMES } from '../jobs/queue.js';
import { CLEANUP_QUEUE_NAME, processCleanupJob } from '../jobs/cleanupJob.js';
import prisma from '../prisma/client.js';
import { logger } from '../utils/logger.js';

/**
 * Execute an HTTP cron job
 */
async function executeHttpJob(jobData) {
  const { targetUrl, httpMethod, headers, payload, timeout } = jobData;

  const config = {
    method: httpMethod.toLowerCase(),
    url: targetUrl,
    timeout,
    headers: headers || {},
    validateStatus: () => true, // Don't throw on any status code
  };

  // Add payload for methods that support body
  if (['post', 'put', 'patch'].includes(config.method) && payload) {
    config.data = payload;
  }

  const response = await axios(config);

  return {
    statusCode: response.status,
    responseBody: typeof response.data === 'object' 
      ? JSON.stringify(response.data).slice(0, 5000) // Limit response size
      : String(response.data).slice(0, 5000),
    success: response.status >= 200 && response.status < 300,
  };
}

/**
 * Execute a script cron job
 * Note: Script execution is disabled for security in this implementation
 */
async function executeScriptJob(jobData) {
  // For security reasons, script execution should be carefully implemented
  // This is a placeholder that logs the command but doesn't execute it
  logger.warn('Script execution is disabled for security', {
    command: jobData.command,
  });

  return {
    statusCode: null,
    responseBody: 'Script execution is disabled for security reasons',
    success: false,
    errorMessage: 'Script execution not implemented',
  };
}

/**
 * Process a cron job
 */
async function processJob(job) {
  const { cronJobId, targetType, maxRetries } = job.data;
  const startedAt = new Date();

  logger.info('Processing cron job', { cronJobId, targetType, jobId: job.id });

  let result = {
    statusCode: null,
    responseBody: null,
    errorMessage: null,
    success: false,
  };

  try {
    // Verify the job still exists and is active
    const cronJob = await prisma.cronJob.findUnique({
      where: { id: cronJobId },
    });

    if (!cronJob) {
      logger.warn('Cron job not found, skipping', { cronJobId });
      return { skipped: true, reason: 'Job not found' };
    }

    if (cronJob.status !== 'ACTIVE') {
      logger.warn('Cron job is not active, skipping', { cronJobId, status: cronJob.status });
      return { skipped: true, reason: 'Job not active' };
    }

    // Execute based on target type
    if (targetType === 'HTTP') {
      result = await executeHttpJob(job.data);
    } else if (targetType === 'SCRIPT') {
      result = await executeScriptJob(job.data);
    } else {
      throw new Error(`Unknown target type: ${targetType}`);
    }
  } catch (error) {
    logger.error('Job execution failed', {
      cronJobId,
      error: error.message,
    });

    result.errorMessage = error.message;
    result.success = false;

    // Re-throw if we haven't exceeded max retries
    if (job.attemptsMade < maxRetries) {
      throw error;
    }
  }

  const finishedAt = new Date();
  const duration = finishedAt.getTime() - startedAt.getTime();

  // Log the execution
  await prisma.executionLog.create({
    data: {
      jobId: cronJobId,
      status: result.success ? 'SUCCESS' : 'FAILED',
      responseCode: result.statusCode,
      responseBody: result.responseBody,
      errorMessage: result.errorMessage,
      startedAt,
      finishedAt,
      duration,
    },
  });

  logger.info('Job execution completed', {
    cronJobId,
    success: result.success,
    duration,
    statusCode: result.statusCode,
  });

  return result;
}

// Create the worker
const worker = new Worker(
  QUEUE_NAMES.CRON_JOBS,
  async (job) => {
    return processJob(job);
  },
  {
    connection: createRedisConnection(),
    concurrency: 10, // Process up to 10 jobs concurrently
    limiter: {
      max: 100,
      duration: 60000, // Max 100 jobs per minute
    },
  }
);

// Worker event handlers
worker.on('ready', () => {
  logger.info('Worker is ready and listening for jobs');
});

worker.on('completed', (job, result) => {
  if (!result?.skipped) {
    logger.debug('Job completed', { jobId: job.id, result });
  }
});

worker.on('failed', (job, error) => {
  logger.error('Job failed', {
    jobId: job?.id,
    cronJobId: job?.data?.cronJobId,
    error: error.message,
    attempts: job?.attemptsMade,
  });
});

worker.on('error', (error) => {
  logger.error('Worker error', { error: error.message });
});

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down workers...');
  await worker.close();
  await cleanupWorker.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

logger.info('Cron worker started', {
  queueName: QUEUE_NAMES.CRON_JOBS,
  concurrency: 10,
});

// Create cleanup worker
const cleanupWorker = new Worker(
  CLEANUP_QUEUE_NAME,
  async (job) => {
    return processCleanupJob(job);
  },
  {
    connection: createRedisConnection(),
    concurrency: 1,
  }
);

cleanupWorker.on('completed', (job, result) => {
  logger.info('Cleanup job completed', { deletedCount: result?.deletedCount });
});

cleanupWorker.on('failed', (job, error) => {
  logger.error('Cleanup job failed', { error: error.message });
});

logger.info('Cleanup worker started', { queueName: CLEANUP_QUEUE_NAME });

