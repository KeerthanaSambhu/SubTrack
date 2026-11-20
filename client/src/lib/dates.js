/*
 * Date helpers.
 *
 * Billing dates are calendar dates, not moments in time. The API stores them
 * as midnight UTC and sends ISO strings ("2026-03-15T00:00:00.000Z"). We only
 * ever read the "YYYY-MM-DD" part and build a *local* Date from it, so a date
 * never shifts by a day because of the user's timezone.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** "2026-03-15" or an ISO string → local Date at midnight. */
export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** Local Date → "YYYY-MM-DD" (the format <input type="date"> uses). */
export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function today() {
  return parseDate(new Date());
}

export function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Adds months, clamping the day so Jan 31 + 1 month = Feb 28/29 (not Mar 3). */
export function addMonths(date, months) {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
}

/** Whole calendar days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from, to) {
  // Math.round absorbs daylight-saving hour shifts.
  return Math.round((parseDate(to) - parseDate(from)) / DAY_MS);
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
