import { z } from 'zod/v4';

// User validation schemas
export const signupSchema = z.object({
  email: z.email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  name: z.string().min(2).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// OTP validation schemas
export const verifyOTPSchema = z.object({
  email: z.email('Invalid email address'),
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});

export const resendOTPSchema = z.object({
  email: z.email('Invalid email address'),
});

// Cron job validation schemas
export const createCronJobSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must not exceed 255 characters'),
  cronExpression: z.string().min(1, 'Cron expression is required'),
  timezone: z.string().default('UTC'),
  targetType: z.enum(['HTTP', 'SCRIPT']),
  targetUrl: z.url('Invalid URL').optional().nullable(),
  command: z.string().max(1000).optional().nullable(),
  headers: z.record(z.string()).optional().nullable(),
  httpMethod: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
  payload: z.any().optional().nullable(),
  retryCount: z.number().int().min(0).max(10).default(0),
  maxRetries: z.number().int().min(0).max(10).default(3),
  timeout: z.number().int().min(1000).max(300000).default(30000),
}).refine(
  (data) => {
    if (data.targetType === 'HTTP' && !data.targetUrl) {
      return false;
    }
    if (data.targetType === 'SCRIPT' && !data.command) {
      return false;
    }
    return true;
  },
  {
    message: 'targetUrl is required for HTTP jobs, command is required for SCRIPT jobs',
  }
);

export const updateCronJobSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  cronExpression: z.string().optional(),
  timezone: z.string().optional(),
  targetType: z.enum(['HTTP', 'SCRIPT']).optional(),
  targetUrl: z.url('Invalid URL').optional().nullable(),
  command: z.string().max(1000).optional().nullable(),
  headers: z.record(z.string()).optional().nullable(),
  httpMethod: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
  payload: z.any().optional().nullable(),
  status: z.enum(['ACTIVE', 'PAUSED']).optional(),
  retryCount: z.number().int().min(0).max(10).optional(),
  maxRetries: z.number().int().min(0).max(10).optional(),
  timeout: z.number().int().min(1000).max(300000).optional(),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const executionLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['SUCCESS', 'FAILED', 'RUNNING', 'TIMEOUT']).optional(),
});

// ID validation
export const uuidSchema = z.uuid('Invalid ID format');
