import AppError from '../utils/AppError.js';

/** Throws a 400 with per-field messages if `errors` has any entries. */
export function assertValid(errors) {
  if (Object.keys(errors).length > 0) {
    throw new AppError(400, 'Please fix the highlighted fields.', errors);
  }
}

export const isPlainString = (value) => typeof value === 'string';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Parses "YYYY-MM-DD" into a midnight-UTC Date, or returns null if invalid. */
export function parseCalendarDate(value) {
  if (!isPlainString(value)) return null;
  const text = value.slice(0, 10);
  if (!DATE_PATTERN.test(text)) return null;
  const [y, m, d] = text.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // Reject impossible dates like 2026-02-31.
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  if (y < 1970 || y > 2200) return null;
  return date;
}
