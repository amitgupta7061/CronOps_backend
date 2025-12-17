import { rateLimit } from 'express-rate-limit';
import { config } from '../utils/config.js';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  limit: config.rateLimit.maxRequests,
  message: {
    success: false,
    status: 'fail',
    message: 'Too many requests, please try again later',
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Stricter rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 50, // 50 requests per window
  message: {
    success: false,
    status: 'fail',
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Rate limiter for job creation
export const jobCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 100, // 100 jobs per hour
  message: {
    success: false,
    status: 'fail',
    message: 'Too many jobs created, please try again later',
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

export default apiLimiter;
