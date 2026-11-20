/*
 * Billing calculations — the single source of truth for every number the
 * app shows. Every function works the same way for weekly, monthly,
 * quarterly and yearly subscriptions.
 */
import { getCategory, getCycle } from './constants';
import {
  addDays,
  addMonths,
  daysBetween,
  endOfMonth,
  parseDate,
  startOfMonth,
  today as getToday,
} from './dates';

const MAX_STEPS = 5000; // safety net for loops over payment dates

/** Cost spread evenly over a month (weekly: × 52 ÷ 12, quarterly: ÷ 3, yearly: ÷ 12). */
export function monthlyCost(sub) {
  return (sub.amount * getCycle(sub.billingCycle).perYear) / 12;
}

/** Total cost over a full year. */
export function yearlyCost(sub) {
  return sub.amount * getCycle(sub.billingCycle).perYear;
}

/**
 * The n-th payment date counted from an anchor date (n can be negative).
 * Always measured from the anchor so month-end dates don't drift
 * (Jan 31 → Feb 28 → Mar 31, not Mar 28).
 */
export function shiftByCycles(anchor, cycle, n) {
  switch (cycle) {
    case 'weekly':
      return addDays(anchor, 7 * n);
    case 'quarterly':
      return addMonths(anchor, 3 * n);
    case 'yearly':
      return addMonths(anchor, 12 * n);
    case 'monthly':
    default:
      return addMonths(anchor, n);
  }
}

/** The next date this subscription will charge, on or after `from`. Null if not active. */
export function nextPaymentDate(sub, from = getToday()) {
  if (sub.status !== 'active') return null;
  const anchor = parseDate(sub.nextPaymentDate);
  if (!anchor) return null;
  for (let n = 0; n < MAX_STEPS; n += 1) {
    const date = shiftByCycles(anchor, sub.billingCycle, n);
    if (date >= from) return date;
  }
  return null;
}

/**
 * Every payment date for a subscription between `from` and `to` (inclusive).
 * - Never before the subscription's start date.
 * - For paused / cancelled subscriptions, nothing after the day the status
 *   changed (those charges no longer happen).
 */
export function paymentsBetween(sub, from, to) {
  const anchor = parseDate(sub.nextPaymentDate);
  const start = parseDate(sub.startDate);
  if (!anchor) return [];

  let lower = from;
  if (start && start > lower) lower = start;

  let upper = to;
  if (sub.status !== 'active') {
    // statusChangedAt is a timestamp, so convert it to the local calendar day.
    const stoppedOn = parseDate(new Date(sub.statusChangedAt || sub.updatedAt));
    if (stoppedOn && stoppedOn < upper) upper = addDays(stoppedOn, -1);
  }
  if (upper < lower) return [];

  const dates = [];
  // Walk backwards from the anchor…
  for (let n = 0; n > -MAX_STEPS; n -= 1) {
    const date = shiftByCycles(anchor, sub.billingCycle, n);
    if (date < lower) break;
    if (date <= upper) dates.push(date);
  }
  // …then forwards.
  for (let n = 1; n < MAX_STEPS; n += 1) {
    const date = shiftByCycles(anchor, sub.billingCycle, n);
    if (date > upper) break;
    if (date >= lower) dates.push(date);
  }
  return dates.sort((a, b) => a - b);
}

/* ---------------------------- Aggregations ---------------------------- */

export const isActive = (sub) => sub.status === 'active';

/** Spending totals for active subscriptions in one currency. */
export function spendingTotals(subs, currency) {
  const relevant = subs.filter((s) => isActive(s) && s.currency === currency);
  const monthly = relevant.reduce((sum, s) => sum + monthlyCost(s), 0);
  return { monthly, yearly: monthly * 12, count: relevant.length };
}

/**
 * Monthly totals for active subscriptions billed in currencies other than
 * the user's preferred one. We never convert currencies with made-up rates;
 * these are shown separately instead.
 */
export function otherCurrencyTotals(subs, currency) {
  const totals = {};
  subs
    .filter((s) => isActive(s) && s.currency !== currency)
    .forEach((s) => {
      totals[s.currency] = totals[s.currency] || { currency: s.currency, monthly: 0, count: 0 };
      totals[s.currency].monthly += monthlyCost(s);
      totals[s.currency].count += 1;
    });
  return Object.values(totals).sort((a, b) => b.monthly - a.monthly);
}

/** Active spend per category (monthly equivalent), largest first. */
export function categoryBreakdown(subs, currency) {
  const map = {};
  subs
    .filter((s) => isActive(s) && s.currency === currency)
    .forEach((s) => {
      const cat = getCategory(s.category);
      map[cat.value] = map[cat.value] || {
        category: cat.value,
        label: cat.label,
        color: cat.color,
        monthly: 0,
        count: 0,
      };
      map[cat.value].monthly += monthlyCost(s);
      map[cat.value].count += 1;
    });
  return Object.values(map)
    .map((c) => ({ ...c, yearly: c.monthly * 12 }))
    .sort((a, b) => b.monthly - a.monthly);
}

/** Active spend grouped by billing frequency. */
export function cycleBreakdown(subs, currency) {
  const order = ['weekly', 'monthly', 'quarterly', 'yearly'];
  return order
    .map((cycle) => {
      const items = subs.filter(
        (s) => isActive(s) && s.currency === currency && s.billingCycle === cycle,
      );
      const monthly = items.reduce((sum, s) => sum + monthlyCost(s), 0);
      return { cycle, label: getCycle(cycle).label, monthly, yearly: monthly * 12, count: items.length };
    })
    .filter((c) => c.count > 0);
}

/**
 * Actual charges per calendar month: `monthsBack` past months, the current
 * month and `monthsAhead` future months. Past months reflect payments that
 * really fell due; future months are projected from active subscriptions.
 */
export function monthlyTrend(subs, currency, { monthsBack = 5, monthsAhead = 6, ref = getToday() } = {}) {
  const relevant = subs.filter((s) => s.currency === currency);
  const current = startOfMonth(ref);
  const months = [];

  for (let offset = -monthsBack; offset <= monthsAhead; offset += 1) {
    const monthStart = addMonths(current, offset);
    const monthEnd = endOfMonth(monthStart);
    let total = 0;
    let payments = 0;
    relevant.forEach((s) => {
      const dates = paymentsBetween(s, monthStart, monthEnd);
      total += dates.length * s.amount;
      payments += dates.length;
    });
    months.push({
      key: `${monthStart.getFullYear()}-${monthStart.getMonth()}`,
      label: monthStart.toLocaleDateString(undefined, { month: 'short' }),
      fullLabel: monthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      total,
      payments,
      period: offset < 0 ? 'past' : offset === 0 ? 'current' : 'future',
    });
  }
  return months;
}

/**
 * Every upcoming charge in the next `days` days (inclusive of today),
 * sorted by date. Weekly subscriptions can appear more than once.
 */
export function upcomingPayments(subs, days, ref = getToday()) {
  const end = addDays(ref, days);
  const list = [];
  subs.filter(isActive).forEach((sub) => {
    paymentsBetween(sub, ref, end).forEach((date) => {
      list.push({ key: `${sub.id}-${date.getTime()}`, sub, date, daysLeft: daysBetween(ref, date) });
    });
  });
  return list.sort((a, b) => a.date - b.date || b.sub.amount - a.sub.amount);
}

/** Active subscriptions ranked by monthly-equivalent cost. */
export function mostExpensive(subs, currency, limit = 5) {
  return subs
    .filter((s) => isActive(s) && s.currency === currency)
    .map((s) => ({ sub: s, monthly: monthlyCost(s), yearly: yearlyCost(s) }))
    .sort((a, b) => b.monthly - a.monthly)
    .slice(0, limit);
}
