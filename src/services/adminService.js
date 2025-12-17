import prisma from '../prisma/client.js';

/**
 * Get all users with pagination
 */
export const getAllUsers = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            cronJobs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);

  return {
    users: users.map(user => ({
      ...user,
      jobCount: user._count.cronJobs,
      _count: undefined,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get user by ID with their jobs
 */
export const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
      cronJobs: {
        select: {
          id: true,
          name: true,
          cronExpression: true,
          status: true,
          targetType: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return user;
};

/**
 * Update user role
 */
export const updateUserRole = async (userId, role) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};

/**
 * Delete user and all their data
 */
export const deleteUser = async (userId) => {
  await prisma.user.delete({
    where: { id: userId },
  });
};

/**
 * Get admin dashboard stats
 */
export const getAdminStats = async () => {
  const [
    totalUsers,
    verifiedUsers,
    totalJobs,
    activeJobs,
    totalExecutions,
    successfulExecutions,
    failedExecutions,
    recentUsers,
    recentExecutions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isVerified: true } }),
    prisma.cronJob.count(),
    prisma.cronJob.count({ where: { status: 'ACTIVE' } }),
    prisma.executionLog.count(),
    prisma.executionLog.count({ where: { status: 'SUCCESS' } }),
    prisma.executionLog.count({ where: { status: 'FAILED' } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    }),
    prisma.executionLog.findMany({
      take: 10,
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        status: true,
        startedAt: true,
        duration: true,
        cronJob: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    users: {
      total: totalUsers,
      verified: verifiedUsers,
      unverified: totalUsers - verifiedUsers,
    },
    jobs: {
      total: totalJobs,
      active: activeJobs,
      paused: totalJobs - activeJobs,
    },
    executions: {
      total: totalExecutions,
      successful: successfulExecutions,
      failed: failedExecutions,
      successRate: totalExecutions > 0 
        ? Math.round((successfulExecutions / totalExecutions) * 100) 
        : 0,
    },
    recentUsers,
    recentExecutions,
  };
};

/**
 * Get all jobs across all users
 */
export const getAllJobs = async (page = 1, limit = 20, status) => {
  const skip = (page - 1) * limit;

  const where = status ? { status } : {};

  const [jobs, total] = await Promise.all([
    prisma.cronJob.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            executionLogs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.cronJob.count({ where }),
  ]);

  return {
    jobs: jobs.map(job => ({
      ...job,
      executionCount: job._count.executionLogs,
      _count: undefined,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get all execution logs across all users
 */
export const getAllExecutionLogs = async (page = 1, limit = 20, status) => {
  const skip = (page - 1) * limit;

  const where = status ? { status } : {};

  const [logs, total] = await Promise.all([
    prisma.executionLog.findMany({
      where,
      skip,
      take: limit,
      include: {
        cronJob: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    }),
    prisma.executionLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export default {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getAdminStats,
  getAllJobs,
  getAllExecutionLogs,
};
