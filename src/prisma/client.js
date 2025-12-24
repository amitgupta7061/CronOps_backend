import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

const globalForPrisma = globalThis;

function createPrismaClient() {
  // Create a pg Pool with proper configuration for cloud databases
  const pool = new Pool({
    connectionString: config.database.url,
    max: 5, // Reduced for serverless environments
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
    // SSL required for cloud PostgreSQL (Neon, Supabase, etc.)
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Allow exit even if pool has clients
    allowExitOnIdle: true,
  });

  // Handle pool errors
  pool.on('error', (err) => {
    logger.error('Unexpected database pool error', { error: err.message });
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
