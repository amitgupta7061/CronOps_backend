import { Router } from 'express';
import authController from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  signupSchema,
  loginSchema,
  refreshTokenSchema,
  verifyOTPSchema,
  resendOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
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
  '/verify-otp',
  authLimiter,
  validate(verifyOTPSchema),
  authController.verifyOTP
);

router.post(
  '/resend-otp',
  authLimiter,
  validate(resendOTPSchema),
  authController.resendOTP
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

// Password reset routes
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getProfile);
router.put(
  '/password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

export default router;


