import executionLogService from '../services/executionLogService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * GET /api/jobs/:jobId/logs
 * Get execution logs for a specific job
 */
export const getJobLogs = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;

  const result = await executionLogService.getExecutionLogs(
    req.user.id,
    req.params.jobId,
    {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status,
    }
  );

  res.status(200).json({
    success: true,
    data: result.logs,
    pagination: result.pagination,
  });
});

/**
 * GET /api/logs/:id
 * Get a single execution log by ID
 */
export const getLogById = asyncHandler(async (req, res) => {
  const log = await executionLogService.getExecutionLogById(
    req.user.id,
    req.params.id
  );

  res.status(200).json({
    success: true,
    data: log,
  });
});

/**
 * GET /api/jobs/:jobId/stats
 * Get execution statistics for a specific job
 */
export const getJobStats = asyncHandler(async (req, res) => {
  const stats = await executionLogService.getJobStatistics(
    req.user.id,
    req.params.jobId
  );

  res.status(200).json({
    success: true,
    data: stats,
  });
});

/**
 * GET /api/stats
 * Get overall statistics for the authenticated user
 */
export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await executionLogService.getUserStatistics(req.user.id);

  res.status(200).json({
    success: true,
    data: stats,
  });
});

export default {
  getJobLogs,
  getLogById,
  getJobStats,
  getUserStats,
};
