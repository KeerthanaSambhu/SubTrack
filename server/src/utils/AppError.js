/**
 * An error that is safe to show to the user.
 * `errors` optionally maps field names to messages for form validation.
 */
export default class AppError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    if (errors) this.errors = errors;
  }
}
