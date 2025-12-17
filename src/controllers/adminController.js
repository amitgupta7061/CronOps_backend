import asyncHandler from '../utils/asyncHandler.js';
import * as adminService from '../services/adminService.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

/**
 * Get admin dashboard stats
 */
export const getAdminStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getAdminStats();

  res.json({
    success: true,
    data: stats,
  });
});

/**
 * Get all users
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const result = await adminService.getAllUsers(
    parseInt(page),
    parseInt(limit)
  );

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Get user by ID
 */
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await adminService.getUserById(id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    data: user,
  });
});

/**
 * Update user role
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['USER', 'ADMIN'].includes(role)) {
    throw new BadRequestError('Invalid role. Must be USER or ADMIN');
  }

  // Prevent admin from changing their own role
  if (id === req.user.id) {
    throw new BadRequestError('You cannot change your own role');
  }

  const user = await adminService.updateUserRole(id, role);

  res.json({
    success: true,
    message: `User role updated to ${role}`,
    data: user,
  });
});

/**
 * Delete user
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (id === req.user.id) {
    throw new BadRequestError('You cannot delete your own account');
  }

  await adminService.deleteUser(id);

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});

/**
 * Get all jobs (across all users)
 */
export const getAllJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;

  const result = await adminService.getAllJobs(
    parseInt(page),
    parseInt(limit),
    status
  );

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Get all execution logs (across all users)
 */
export const getAllExecutionLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;

  const result = await adminService.getAllExecutionLogs(
    parseInt(page),
    parseInt(limit),
    status
  );

  res.json({
    success: true,
    data: result,
  });
});

export default {
  getAdminStats,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getAllJobs,
  getAllExecutionLogs,
};
