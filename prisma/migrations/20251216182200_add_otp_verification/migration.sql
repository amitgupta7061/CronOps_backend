-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('HTTP', 'SCRIPT');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "HttpMethod" AS ENUM ('GET', 'POST', 'PUT', 'PATCH', 'DELETE');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('SUCCESS', 'FAILED', 'RUNNING', 'TIMEOUT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "refreshToken" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "otp" TEXT,
    "otpExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cron_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cronExpression" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "targetType" "TargetType" NOT NULL,
    "targetUrl" TEXT,
    "command" TEXT,
    "headers" JSONB,
    "httpMethod" "HttpMethod" NOT NULL DEFAULT 'GET',
    "payload" JSONB,
    "status" "JobStatus" NOT NULL DEFAULT 'ACTIVE',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "timeout" INTEGER NOT NULL DEFAULT 30000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cron_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_logs" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL,
    "responseCode" INTEGER,
    "responseBody" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "cron_jobs_userId_idx" ON "cron_jobs"("userId");

-- CreateIndex
CREATE INDEX "cron_jobs_status_idx" ON "cron_jobs"("status");

-- CreateIndex
CREATE INDEX "execution_logs_jobId_idx" ON "execution_logs"("jobId");

-- CreateIndex
CREATE INDEX "execution_logs_status_idx" ON "execution_logs"("status");

-- CreateIndex
CREATE INDEX "execution_logs_startedAt_idx" ON "execution_logs"("startedAt");

-- AddForeignKey
ALTER TABLE "cron_jobs" ADD CONSTRAINT "cron_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_logs" ADD CONSTRAINT "execution_logs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "cron_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
