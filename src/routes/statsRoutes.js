import { Router } from 'express';
import executionLogController from '../controllers/executionLogController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User dashboard statistics
router.get('/', executionLogController.getUserStats);

export default router;
