import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Create demo users
  const hashedPassword = await bcrypt.hash('Password123!', 12);

  const user1 = await prisma.user.upsert({
    where: { email: 'demo@cronops.dev' },
    update: {},
    create: {
      email: 'demo@cronops.dev',
      password: hashedPassword,
      name: 'Demo User',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'admin@cronops.dev' },
    update: {},
    create: {
      email: 'admin@cronops.dev',
      password: hashedPassword,
      name: 'Admin User',
    },
  });

  console.log('✅ Users created:', { user1: user1.email, user2: user2.email });

  // Create sample cron jobs for demo user
  const cronJobs = await Promise.all([
    prisma.cronJob.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        userId: user1.id,
        name: 'Health Check - API Server',
        cronExpression: '*/5 * * * *', // Every 5 minutes
        timezone: 'UTC',
        targetType: 'HTTP',
        targetUrl: 'https://httpbin.org/get',
        httpMethod: 'GET',
        status: 'ACTIVE',
        timeout: 10000,
        maxRetries: 3,
      },
    }),
    prisma.cronJob.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        userId: user1.id,
        name: 'Daily Report Webhook',
        cronExpression: '0 9 * * *', // Every day at 9 AM
        timezone: 'America/New_York',
        targetType: 'HTTP',
        targetUrl: 'https://httpbin.org/post',
        httpMethod: 'POST',
        headers: { 'Content-Type': 'application/json' },
        payload: { report: 'daily', type: 'summary' },
        status: 'ACTIVE',
        timeout: 30000,
        maxRetries: 2,
      },
    }),
    prisma.cronJob.upsert({
      where: { id: '00000000-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000003',
        userId: user1.id,
        name: 'Database Cleanup',
        cronExpression: '0 2 * * 0', // Every Sunday at 2 AM
        timezone: 'UTC',
        targetType: 'HTTP',
        targetUrl: 'https://httpbin.org/delete',
        httpMethod: 'DELETE',
        status: 'PAUSED',
        timeout: 60000,
        maxRetries: 1,
      },
    }),
    prisma.cronJob.upsert({
      where: { id: '00000000-0000-0000-0000-000000000004' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000004',
        userId: user1.id,
        name: 'Hourly Metrics Collection',
        cronExpression: '0 * * * *', // Every hour
        timezone: 'Europe/London',
        targetType: 'HTTP',
        targetUrl: 'https://httpbin.org/post',
        httpMethod: 'POST',
        headers: { 'X-API-Key': 'demo-key-123' },
        payload: { metrics: true, timestamp: 'auto' },
        status: 'ACTIVE',
        timeout: 15000,
        maxRetries: 3,
      },
    }),
  ]);

  console.log('✅ Cron jobs created:', cronJobs.length);

  // Create sample execution logs
  const now = new Date();
  const executionLogs = [];

  for (let i = 0; i < 10; i++) {
    const startedAt = new Date(now.getTime() - i * 60 * 60 * 1000); // Every hour for last 10 hours
    const duration = Math.floor(Math.random() * 2000) + 100;
    const finishedAt = new Date(startedAt.getTime() + duration);
    const isSuccess = Math.random() > 0.2; // 80% success rate

    executionLogs.push({
      jobId: cronJobs[0].id,
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      responseCode: isSuccess ? 200 : (Math.random() > 0.5 ? 500 : 503),
      responseBody: isSuccess 
        ? JSON.stringify({ status: 'ok', timestamp: startedAt.toISOString() })
        : null,
      errorMessage: isSuccess ? null : 'Connection timeout',
      startedAt,
      finishedAt,
      duration,
    });
  }

  await prisma.executionLog.createMany({
    data: executionLogs,
    skipDuplicates: true,
  });

  console.log('✅ Execution logs created:', executionLogs.length);

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📝 Demo Credentials:');
  console.log('   Email: demo@cronops.dev');
  console.log('   Password: Password123!');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
