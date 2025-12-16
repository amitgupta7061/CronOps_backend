import prisma from '../prisma/client.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

/**
 * Creates an execution log entry
 */
export async function createExecutionLog(data) {
  return prisma.executionLog.create({
    data: {
      jobId: data.jobId,
      status: data.status,
      responseCode: data.responseCode,
      responseBody: data.responseBody,
      errorMessage: data.errorMessage,
      startedAt: data.startedAt,
      finishedAt: data.finishedAt,
      duration: data.duration,
    },
  });
}

/**
 * Gets execution logs for a specific job
 */
export async function getExecutionLogs(
  userId,
  jobId,
  { page = 1, limit = 20, status } = {}
) {
  // First verify the user owns this job
  const job = await prisma.cronJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new NotFoundError('Cron job not found');
  }

  if (job.userId !== userId) {
    throw new ForbiddenError('You do not have access to this job');
  }

  const where = { jobId };
  if (status) {
    where.status = status;
  }

  const [logs, total] = await Promise.all([
    prisma.executionLog.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.executionLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Gets a single execution log by ID
 */
export async function getExecutionLogById(userId, logId) {
  const log = await prisma.executionLog.findUnique({
    where: { id: logId },
    include: {
      cronJob: {
        select: {
          id: true,
          userId: true,
          name: true,
        },
      },
    },
  });

  if (!log) {
    throw new NotFoundError('Execution log not found');
  }

  if (log.cronJob.userId !== userId) {
    throw new ForbiddenError('You do not have access to this log');
  }

  return log;
}

/**
 * Gets execution statistics for a job
 */
export async function getJobStatistics(userId, jobId) {
  // Verify ownership
  const job = await prisma.cronJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new NotFoundError('Cron job not found');
  }

  if (job.userId !== userId) {
    throw new ForbiddenError('You do not have access to this job');
  }

  const [totalExecutions, successCount, failedCount, avgDuration, recentLogs] =
    await Promise.all([
      prisma.executionLog.count({ where: { jobId } }),
      prisma.executionLog.count({ where: { jobId, status: 'SUCCESS' } }),
      prisma.executionLog.count({ where: { jobId, status: 'FAILED' } }),
      prisma.executionLog.aggregate({
        where: { jobId, duration: { not: null } },
        _avg: { duration: true },
      }),
      prisma.executionLog.findMany({
        where: { jobId },
        orderBy: { startedAt: 'desc' },
        take: 5,
      }),
    ]);

  return {
    jobId,
    totalExecutions,
    successCount,
    failedCount,
    successRate: totalExecutions > 0 
      ? ((successCount / totalExecutions) * 100).toFixed(2) 
      : 0,
    averageDuration: avgDuration._avg.duration 
      ? Math.round(avgDuration._avg.duration) 
      : null,
    recentExecutions: recentLogs,
  };
}

/**
 * Gets overall statistics for a user's jobs
 */
export async function getUserStatistics(userId) {
  const [
    totalJobs,
    activeJobs,
    pausedJobs,
    totalExecutions,
    successfulExecutions,
    failedExecutions,
  ] = await Promise.all([
    prisma.cronJob.count({ where: { userId } }),
    prisma.cronJob.count({ where: { userId, status: 'ACTIVE' } }),
    prisma.cronJob.count({ where: { userId, status: 'PAUSED' } }),
    prisma.executionLog.count({
      where: { cronJob: { userId } },
    }),
    prisma.executionLog.count({
      where: { cronJob: { userId }, status: 'SUCCESS' },
    }),
    prisma.executionLog.count({
      where: { cronJob: { userId }, status: 'FAILED' },
    }),
  ]);

  // Get recent executions across all user's jobs
  const recentExecutions = await prisma.executionLog.findMany({
    where: { cronJob: { userId } },
    orderBy: { startedAt: 'desc' },
    take: 10,
    include: {
      cronJob: {
        select: { id: true, name: true },
      },
    },
  });

  return {
    jobs: {
      total: totalJobs,
      active: activeJobs,
      paused: pausedJobs,
    },
    executions: {
      total: totalExecutions,
      successful: successfulExecutions,
      failed: failedExecutions,
      successRate: totalExecutions > 0
        ? ((successfulExecutions / totalExecutions) * 100).toFixed(2)
        : 0,
    },
    recentExecutions,
  };
}

/**
 * Deletes old execution logs (for maintenance)
 */
export async function deleteOldExecutionLogs(daysToKeep = 30) {
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

export default {
  createExecutionLog,
  getExecutionLogs,
  getExecutionLogById,
  getJobStatistics,
  getUserStatistics,
  deleteOldExecutionLogs,
};
