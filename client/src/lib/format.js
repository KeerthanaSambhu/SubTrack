import { parseDate } from './dates';

const formatterCache = new Map();

function getFormatter(currency, fractionDigits) {
  const key = `${currency}-${fractionDigits}`;
  if (!formatterCache.has(key)) {
    // Indian grouping (1,00,000) for rupees; the browser's locale otherwise.
    const locale = currency === 'INR' ? 'en-IN' : undefined;
    formatterCache.set(
      key,
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }),
    );
  }
  return formatterCache.get(key);
}

/** ₹499 · ₹1,299.50 · $9.99 — whole numbers drop the decimals. */
export function formatMoney(amount, currency = 'INR', { compact = false } = {}) {
  const value = Number(amount) || 0;
  if (compact && Math.abs(value) >= 1000) {
    const locale = currency === 'INR' ? 'en-IN' : undefined;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  const rounded = Math.round(value * 100) / 100;
  const digits = currency === 'JPY' || Number.isInteger(rounded) ? 0 : 2;
  return getFormatter(currency, digits).format(rounded);
}

/** "15 Mar 2026" */
export function formatDate(value, { withYear = true } = {}) {
  const date = parseDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

/** "Today", "Tomorrow", "In 5 days" */
export function formatDaysLeft(days) {
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function initials(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || '?'
  );
}
