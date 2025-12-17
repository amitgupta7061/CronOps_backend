import { Router } from 'express';
import userController from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Update plan
router.put('/plan', userController.updatePlan);

export default router;
