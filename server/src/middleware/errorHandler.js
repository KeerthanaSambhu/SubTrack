import mongoose from 'mongoose';
import config from '../config/index.js';
import { sendFailure } from '../utils/respond.js';

export function notFound(req, res) {
  sendFailure(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

/**
 * Central error handler — the last middleware in the chain.
 * Express 5 forwards errors thrown in async controllers here automatically.
 *
 * Turns every error into the standard failure shape:
 *   { success: false, message: string, errors?: { field: message } }
 * Unexpected errors are logged, but their details never reach the client
 * in production.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Errors we threw on purpose (validation, not found, unauthorised, ...).
  if (err.name === 'AppError') {
    return sendFailure(res, err.statusCode, err.message, err.errors);
  }

  // Body problems detected by express.json().
  if (err.type === 'entity.parse.failed') {
    return sendFailure(res, 400, 'The request body is not valid JSON.');
  }
  if (err.type === 'entity.too.large') {
    return sendFailure(res, 413, 'The request is too large.');
  }

  // Mongoose schema validation (a safety net behind our own validators).
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.fromEntries(Object.entries(err.errors).map(([field, e]) => [field, e.message]));
    return sendFailure(res, 400, 'Please fix the highlighted fields.', errors);
  }

  // An id that isn't a valid ObjectId.
  if (err instanceof mongoose.Error.CastError) {
    return sendFailure(res, 404, 'Not found.');
  }

  // Unique index violation (e.g. two sign-ups with the same email at once).
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    const message = field === 'email' ? 'An account with this email already exists.' : `That ${field} is already in use.`;
    return sendFailure(res, 409, message, { [field]: message });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: 'Something went wrong on our side. Please try again.',
    ...(!config.isProduction && { detail: err.message }),
  });
}
