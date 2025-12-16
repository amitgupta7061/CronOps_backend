import { AppError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod/v4';

export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(err.message, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle Zod validation errors
  if (err instanceof z.ZodError) {
    const errors = z.flattenError(err).fieldErrors;
    const formattedErrors = Object.entries(errors).map(([field, messages]) => ({
      field,
      message: messages?.[0] || 'Invalid value',
    }));

    return res.status(422).json({
      success: false,
      status: 'fail',
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }

  // Handle custom app errors
  if (err instanceof AppError) {
    const response = {
      success: false,
      status: err.status,
      message: err.message,
    };

    if (err instanceof ValidationError && err.errors) {
      response.errors = err.errors;
    }

    // Include additional data if present (e.g., for verification required)
    if (err.data) {
      response.data = err.data;
    }

    return res.status(err.statusCode).json(response);
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      status: 'fail',
      message: 'A record with this value already exists',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      status: 'fail',
      message: 'Record not found',
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      status: 'fail',
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      status: 'fail',
      message: 'Token expired',
    });
  }

  // Default to 500 internal server error
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  res.status(statusCode).json({
    success: false,
    status: 'error',
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    status: 'fail',
    message: `Route ${req.method} ${req.path} not found`,
  });
};

export default errorHandler;
