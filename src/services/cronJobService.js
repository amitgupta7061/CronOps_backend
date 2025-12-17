import prisma from '../prisma/client.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { validateCronExpression, getNextExecution } from '../utils/cronValidator.js';
import { cronQueue } from '../jobs/queue.js';

/**
 * Creates a new cron job
 */
export async function createCronJob(userId, data) {
  // Validate cron expression
  validateCronExpression(data.cronExpression, data.timezone);

  const cronJob = await prisma.cronJob.create({
    data: {
      userId,
      name: data.name,
      cronExpression: data.cronExpression,
      timezone: data.timezone || 'UTC',
      targetType: data.targetType,
      targetUrl: data.targetUrl,
      command: data.command,
      headers: data.headers,
      httpMethod: data.httpMethod || 'GET',
      payload: data.payload,
      retryCount: data.retryCount || 0,
      maxRetries: data.maxRetries || 3,
      timeout: data.timeout || 30000,
      status: 'ACTIVE',
    },
  });

  // Add to BullMQ queue
  await addJobToQueue(cronJob);

  return {
    ...cronJob,
    nextExecution: getNextExecution(cronJob.cronExpression, cronJob.timezone),
  };
}

/**
 * Gets all cron jobs for a user
 */
export async function getCronJobs(userId, { page = 1, limit = 20, status } = {}) {
  const where = { userId };
  if (status) {
    where.status = status;
  }

  const [jobs, total] = await Promise.all([
    prisma.cronJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.cronJob.count({ where }),
  ]);

  // Add next execution time to each job
  const jobsWithNextExecution = jobs.map((job) => ({
    ...job,
    nextExecution: job.status === 'ACTIVE' 
      ? getNextExecution(job.cronExpression, job.timezone)
      : null,
  }));

  return {
    jobs: jobsWithNextExecution,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Gets a single cron job by ID
 */
export async function getCronJobById(userId, jobId) {
  const job = await prisma.cronJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new NotFoundError('Cron job not found');
  }

  if (job.userId !== userId) {
    throw new ForbiddenError('You do not have access to this job');
  }

  return {
    ...job,
    nextExecution: job.status === 'ACTIVE' 
      ? getNextExecution(job.cronExpression, job.timezone)
      : null,
  };
}

/**
 * Updates a cron job
 */
export async function updateCronJob(userId, jobId, data) {
  const existingJob = await getCronJobById(userId, jobId);

  // If updating cron expression, validate it
  if (data.cronExpression) {
    validateCronExpression(data.cronExpression, data.timezone || existingJob.timezone);
  }

  const updatedJob = await prisma.cronJob.update({
    where: { id: jobId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.cronExpression && { cronExpression: data.cronExpression }),
      ...(data.timezone && { timezone: data.timezone }),
      ...(data.targetType && { targetType: data.targetType }),
      ...(data.targetUrl !== undefined && { targetUrl: data.targetUrl }),
      ...(data.command !== undefined && { command: data.command }),
      ...(data.headers !== undefined && { headers: data.headers }),
      ...(data.httpMethod && { httpMethod: data.httpMethod }),
      ...(data.payload !== undefined && { payload: data.payload }),
      ...(data.status && { status: data.status }),
      ...(data.retryCount !== undefined && { retryCount: data.retryCount }),
      ...(data.maxRetries !== undefined && { maxRetries: data.maxRetries }),
      ...(data.timeout !== undefined && { timeout: data.timeout }),
    },
  });

  // Update BullMQ queue
  await removeJobFromQueue(jobId);
  if (updatedJob.status === 'ACTIVE') {
    await addJobToQueue(updatedJob);
  }

  return {
    ...updatedJob,
    nextExecution: updatedJob.status === 'ACTIVE'
      ? getNextExecution(updatedJob.cronExpression, updatedJob.timezone)
      : null,
  };
}

/**
 * Deletes a cron job
 */
export async function deleteCronJob(userId, jobId) {
  await getCronJobById(userId, jobId); // Verify ownership

  // Remove from queue first
  await removeJobFromQueue(jobId);

  await prisma.cronJob.delete({
    where: { id: jobId },
  });
}

/**
 * Pauses a cron job
 */
export async function pauseCronJob(userId, jobId) {
  const job = await getCronJobById(userId, jobId);

  if (job.status === 'PAUSED') {
    return job;
  }

  const updatedJob = await prisma.cronJob.update({
    where: { id: jobId },
    data: { status: 'PAUSED' },
  });

  // Remove from BullMQ queue
  await removeJobFromQueue(jobId);

  return updatedJob;
}

/**
 * Resumes a cron job
 */
export async function resumeCronJob(userId, jobId) {
  const job = await getCronJobById(userId, jobId);

  if (job.status === 'ACTIVE') {
    return job;
  }

  const updatedJob = await prisma.cronJob.update({
    where: { id: jobId },
    data: { status: 'ACTIVE' },
  });

  // Add back to BullMQ queue
  await addJobToQueue(updatedJob);

  return {
    ...updatedJob,
    nextExecution: getNextExecution(updatedJob.cronExpression, updatedJob.timezone),
  };
}

/**
 * Adds a job to the BullMQ queue
 */
async function addJobToQueue(cronJob) {
  const jobKey = `cron-${cronJob.id}`;
  
  await cronQueue.add(
    jobKey,
    {
      cronJobId: cronJob.id,
      targetType: cronJob.targetType,
      targetUrl: cronJob.targetUrl,
      command: cronJob.command,
      headers: cronJob.headers,
      httpMethod: cronJob.httpMethod,
      payload: cronJob.payload,
      timeout: cronJob.timeout,
      maxRetries: cronJob.maxRetries,
    },
    {
      repeat: {
        pattern: cronJob.cronExpression,
        tz: cronJob.timezone,
      },
      jobId: cronJob.id,
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
}

/**
 * Removes a job from the BullMQ queue
 */
async function removeJobFromQueue(jobId) {
  const repeatableJobs = await cronQueue.getRepeatableJobs();
  
  for (const job of repeatableJobs) {
    if (job.id === jobId) {
      await cronQueue.removeRepeatableByKey(job.key);
    }
  }
}

/**
 * Syncs all active jobs to the queue (used on server restart)
 */
export async function syncActiveJobsToQueue() {
  const activeJobs = await prisma.cronJob.findMany({
    where: { status: 'ACTIVE' },
  });

  // First, clear all existing repeatable jobs
  const repeatableJobs = await cronQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await cronQueue.removeRepeatableByKey(job.key);
  }

  // Add all active jobs
  for (const job of activeJobs) {
    await addJobToQueue(job);
  }

  return activeJobs.length;
}

/**
 * Triggers immediate execution of a cron job
 */
export async function runJobNow(userId, jobId) {
  const job = await getCronJobById(userId, jobId);

  // Add a one-time job to the queue for immediate execution
  await cronQueue.add(
    `immediate-${job.id}`,
    {
      cronJobId: job.id,
      targetType: job.targetType,
      targetUrl: job.targetUrl,
      command: job.command,
      headers: job.headers,
      httpMethod: job.httpMethod,
      payload: job.payload,
      timeout: job.timeout,
      maxRetries: job.maxRetries,
    },
    {
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  return job;
}

export default {
  createCronJob,
  getCronJobs,
  getCronJobById,
  updateCronJob,
  deleteCronJob,
  pauseCronJob,
  resumeCronJob,
  syncActiveJobsToQueue,
  runJobNow,
};
