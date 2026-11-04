import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { getTranslation, extractLanguageFromReq } from '../utils/i18n.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose cast error / ObjectId invalid
  if (err.name === 'CastError') {
    const message = `Resource not found with id ${err.value}`;
    error = new ApiError(404, message, 'RESOURCE_NOT_FOUND');
  }

  // Handle Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    error = new ApiError(409, message, 'DUPLICATE_KEY_ERROR');
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new ApiError(400, messages.join(', '), 'VALIDATION_ERROR', messages);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid authentication token', 'AUTH_TOKEN_INVALID');
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Authentication token has expired', 'AUTH_TOKEN_EXPIRED');
  }

  const statusCode = error.statusCode || 500;
  const errorCode = error.errorCode || 'INTERNAL_SERVER_ERROR';
  const lang = extractLanguageFromReq(req);
  const message = getTranslation(errorCode, lang, error.message || 'Internal Server Error');

  if (statusCode >= 500) {
    logger.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    errorCode,
    message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
