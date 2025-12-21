import { Router } from 'express';
import authRoutes from './authRoutes.js';
import jobRoutes from './jobRoutes.js';
import logRoutes from './logRoutes.js';
import statsRoutes from './statsRoutes.js';
import adminRoutes from './adminRoutes.js';
import userRoutes from './userRoutes.js';
import prisma from '../prisma/client.js';
import { redis } from '../jobs/redis.js';
import { cronQueue } from '../jobs/queue.js';

const router = Router();

// Enhanced health check endpoint with DB and Redis status
router.get('/health', async (req, res) => {
  const health = {
    success: true,
    message: 'CronOps API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: { status: 'unknown', responseTime: null },
      redis: { status: 'unknown', responseTime: null },
      queue: { status: 'unknown', jobCounts: null },
    },
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart,
    };
  } catch (error) {
    health.services.database = {
      status: 'unhealthy',
      error: error.message,
    };
    health.success = false;
  }

  // Check Redis connectivity
  try {
    const redisStart = Date.now();
    await redis.ping();
    health.services.redis = {
      status: 'healthy',
      responseTime: Date.now() - redisStart,
    };
  } catch (error) {
    health.services.redis = {
      status: 'unhealthy',
      error: error.message,
    };
    health.success = false;
  }

  // Check queue status
  try {
    const [waiting, active, completed, failed] = await Promise.all([
      cronQueue.getWaitingCount(),
      cronQueue.getActiveCount(),
      cronQueue.getCompletedCount(),
      cronQueue.getFailedCount(),
    ]);
    health.services.queue = {
      status: 'healthy',
      jobCounts: { waiting, active, completed, failed },
    };
  } catch (error) {
    health.services.queue = {
      status: 'unhealthy',
      error: error.message,
    };
    health.success = false;
  }

  const statusCode = health.success ? 200 : 503;
  res.status(statusCode).json(health);
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/logs', logRoutes);
router.use('/stats', statsRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);

export default router;

