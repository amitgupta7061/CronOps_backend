import { ForbiddenError } from '../utils/errors.js';

/**
 * Middleware to check if user is an admin
 */
export const adminAuth = (req, res, next) => {
  if (!req.user) {
    throw new ForbiddenError('Authentication required');
  }

  if (req.user.role !== 'ADMIN') {
    throw new ForbiddenError('Admin access required');
  }

  next();
};

export default adminAuth;
