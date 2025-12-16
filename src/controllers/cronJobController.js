import cronJobService from '../services/cronJobService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * POST /api/jobs
 * Create a new cron job
 */
export const createJob = asyncHandler(async (req, res) => {
  const job = await cronJobService.createCronJob(req.user.id, req.body);

  res.status(201).json({
    success: true,
    message: 'Cron job created successfully',
    data: job,
  });
});

/**
 * GET /api/jobs
 * Get all cron jobs for the authenticated user
 */
export const getJobs = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;

  const result = await cronJobService.getCronJobs(req.user.id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    status,
  });

  res.status(200).json({
    success: true,
    data: result.jobs,
    pagination: result.pagination,
  });
});

/**
 * GET /api/jobs/:id
 * Get a single cron job by ID
 */
export const getJobById = asyncHandler(async (req, res) => {
  const job = await cronJobService.getCronJobById(req.user.id, req.params.id);

  res.status(200).json({
    success: true,
    data: job,
  });
});

/**
 * PUT /api/jobs/:id
 * Update a cron job
 */
export const updateJob = asyncHandler(async (req, res) => {
  const job = await cronJobService.updateCronJob(
    req.user.id,
    req.params.id,
    req.body
  );

  res.status(200).json({
    success: true,
    message: 'Cron job updated successfully',
    data: job,
  });
});

/**
 * DELETE /api/jobs/:id
 * Delete a cron job
 */
export const deleteJob = asyncHandler(async (req, res) => {
  await cronJobService.deleteCronJob(req.user.id, req.params.id);

  res.status(200).json({
    success: true,
    message: 'Cron job deleted successfully',
  });
});

/**
 * POST /api/jobs/:id/pause
 * Pause a cron job
 */
export const pauseJob = asyncHandler(async (req, res) => {
  const job = await cronJobService.pauseCronJob(req.user.id, req.params.id);

  res.status(200).json({
    success: true,
    message: 'Cron job paused successfully',
    data: job,
  });
});

/**
 * POST /api/jobs/:id/resume
 * Resume a paused cron job
 */
export const resumeJob = asyncHandler(async (req, res) => {
  const job = await cronJobService.resumeCronJob(req.user.id, req.params.id);

  res.status(200).json({
    success: true,
    message: 'Cron job resumed successfully',
    data: job,
  });
});

export default {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  pauseJob,
  resumeJob,
};
