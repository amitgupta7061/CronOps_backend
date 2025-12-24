import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from '../utils/config.js';

const { Pool } = pg;

const globalForPrisma = globalThis;

function createPrismaClient() {
  // Create a pg Pool with proper configuration for cloud databases
  const pool = new Pool({
    connectionString: config.database.url,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    // Keep connections alive
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
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
