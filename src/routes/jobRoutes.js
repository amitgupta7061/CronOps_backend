import { Router } from 'express';
import cronJobController from '../controllers/cronJobController.js';
import executionLogController from '../controllers/executionLogController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { jobCreationLimiter } from '../middleware/rateLimiter.js';
import {
  createCronJobSchema,
  updateCronJobSchema,
  paginationSchema,
  executionLogsQuerySchema,
} from '../utils/validators.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Cron job CRUD operations
router.post(
  '/',
  jobCreationLimiter,
  validate(createCronJobSchema),
  cronJobController.createJob
);

router.get(
  '/',
  validate(paginationSchema, 'query'),
  cronJobController.getJobs
);

router.get('/:id', cronJobController.getJobById);

router.put(
  '/:id',
  validate(updateCronJobSchema),
  cronJobController.updateJob
);

router.delete('/:id', cronJobController.deleteJob);

// Job control operations
router.post('/:id/pause', cronJobController.pauseJob);
router.post('/:id/resume', cronJobController.resumeJob);

// Execution logs for a specific job
router.get(
  '/:jobId/logs',
  validate(executionLogsQuerySchema, 'query'),
  executionLogController.getJobLogs
);

// Job statistics
router.get('/:jobId/stats', executionLogController.getJobStats);

export default router;
