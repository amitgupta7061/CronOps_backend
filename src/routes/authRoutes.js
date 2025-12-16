import { Router } from 'express';
import authController from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  signupSchema,
  loginSchema,
  refreshTokenSchema,
} from '../utils/validators.js';

const router = Router();

// Public routes (with auth rate limiting)
router.post(
  '/signup',
  authLimiter,
  validate(signupSchema),
  authController.signup
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refreshToken
);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getProfile);

export default router;
