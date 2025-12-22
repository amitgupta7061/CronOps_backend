import Redis from 'ioredis';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

// Create Redis connection
export const createRedisConnection = () => {
  let connection;

  // Use REDIS_URL for Upstash or other cloud Redis providers
  if (config.redis.url) {
    logger.info('Connecting to Redis using URL (Upstash)');
    connection = new Redis(config.redis.url, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      tls: {
        rejectUnauthorized: false, // Required for Upstash
      },
    });
  } else {
    // Fallback to host/port/password for local Redis
    logger.info('Connecting to Redis using host/port');
    connection = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
    });
  }

  connection.on('connect', () => {
    logger.info('Redis connected');
  });

  connection.on('error', (err) => {
    logger.error('Redis connection error', { error: err.message });
  });

  return connection;
};

export const redis = createRedisConnection();

export default redis;
