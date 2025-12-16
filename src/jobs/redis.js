import Redis from 'ioredis';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

// Create Redis connection
export const createRedisConnection = () => {
  const connection = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
  });

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
