import mongoose from 'mongoose';
import config from '../config/index.js';

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

/**
 * Turns every error into a consistent JSON response:
 *   { message: string, errors?: { field: message } }
 * Unexpected errors are logged but their details are never sent to the client.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Errors we threw on purpose.
  if (err.name === 'AppError') {
    return res.status(err.statusCode).json({ message: err.message, ...(err.errors && { errors: err.errors }) });
  }

  // Malformed JSON body.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'The request body is not valid JSON.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'The request is too large.' });
  }

  // Mongoose schema validation (a safety net behind our own validators).
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.fromEntries(Object.entries(err.errors).map(([field, e]) => [field, e.message]));
    return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });
  }

  // An id that isn't a valid ObjectId.
  if (err instanceof mongoose.Error.CastError) {
    return res.status(404).json({ message: 'Not found.' });
  }

  // Unique index violation (e.g. email already registered).
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    const message = field === 'email' ? 'An account with this email already exists.' : `That ${field} is already in use.`;
    return res.status(409).json({ message, errors: { [field]: message } });
  }

  console.error(err);
  return res.status(500).json({
    message: 'Something went wrong on our side. Please try again.',
    ...(!config.isProduction && { detail: err.message }),
  });
}
