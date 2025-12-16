import { Router } from 'express';
import executionLogController from '../controllers/executionLogController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get single log by ID
router.get('/:id', executionLogController.getLogById);

export default router;
