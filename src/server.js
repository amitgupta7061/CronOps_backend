import app from './app.js';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';
import prisma from './prisma/client.js';
import { cronQueue } from './jobs/queue.js';
import { syncActiveJobsToQueue } from './services/cronJobService.js';

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Sync active cron jobs to the queue
    const syncedJobs = await syncActiveJobsToQueue();
    logger.info(`Synced ${syncedJobs} active jobs to queue`);

    // Start the server
    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`, {
        env: config.env,
        port: config.port,
      });
    });

    // Graceful shutdown handler
    const shutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await cronQueue.close();
          logger.info('Queue closed');

          await prisma.$disconnect();
          logger.info('Database disconnected');

          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error: error.message });
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason });
    });

  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

startServer();
