import { Router } from 'express';
import adminController from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(adminAuth);

// Admin dashboard stats
router.get('/stats', adminController.getAdminStats);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// View all jobs across all users
router.get('/jobs', adminController.getAllJobs);

// View all execution logs across all users
router.get('/logs', adminController.getAllExecutionLogs);

export default router;
