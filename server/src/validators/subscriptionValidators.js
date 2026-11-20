import { BILLING_CYCLES, CATEGORIES, CURRENCIES, STATUSES } from '../utils/constants.js';
import { assertValid, isPlainString, parseCalendarDate } from './helpers.js';

/*
 * Validates a subscription payload. Only known fields are copied into the
 * result, so clients can't set things like `user` or `_id` themselves.
 *
 * `partial: true` (for PATCH) validates only the fields that were sent.
 */
export function validateSubscription(body = {}, { partial = false } = {}) {
  const errors = {};
  const data = {};
  const has = (field) => body[field] !== undefined;
  const need = (field) => !partial || has(field);

  if (need('name')) {
    if (!isPlainString(body.name) || !body.name.trim()) errors.name = 'Give this subscription a name.';
    else if (body.name.trim().length > 60) errors.name = 'Keep the name under 60 characters.';
    else data.name = body.name.trim();
  }

  if (need('amount')) {
    const amount = typeof body.amount === 'string' && body.amount.trim() !== '' ? Number(body.amount) : body.amount;
    if (typeof amount !== 'number' || !Number.isFinite(amount)) errors.amount = 'Enter how much you pay.';
    else if (amount <= 0) errors.amount = 'Enter an amount greater than zero.';
    else if (amount > 10000000) errors.amount = 'That amount looks too large.';
    else data.amount = Math.round(amount * 100) / 100;
  }

  if (has('currency')) {
    if (!CURRENCIES.includes(body.currency)) errors.currency = 'Choose a supported currency.';
    else data.currency = body.currency;
  }

  if (has('category')) {
    if (!CATEGORIES.includes(body.category)) errors.category = 'Choose a category from the list.';
    else data.category = body.category;
  }

  if (need('billingCycle')) {
    if (!BILLING_CYCLES.includes(body.billingCycle)) errors.billingCycle = 'Choose weekly, monthly, quarterly or yearly.';
    else data.billingCycle = body.billingCycle;
  }

  for (const field of ['startDate', 'nextPaymentDate']) {
    if (need(field)) {
      const date = parseCalendarDate(body[field]);
      if (!date) errors[field] = field === 'startDate' ? 'Enter a valid start date.' : 'Choose the next payment date.';
      else data[field] = date;
    }
  }

  if (has('status')) {
    if (!STATUSES.includes(body.status)) errors.status = 'Choose active, paused or cancelled.';
    else data.status = body.status;
  }

  if (has('notes')) {
    if (!isPlainString(body.notes)) errors.notes = 'Notes must be text.';
    else if (body.notes.length > 500) errors.notes = 'Notes can be up to 500 characters.';
    else data.notes = body.notes.trim();
  }

  assertValid(errors);
  return data;
}

/** Cross-field rule, checked against the final (merged) values. */
export function assertDatesInOrder(startDate, nextPaymentDate) {
  if (startDate > nextPaymentDate) {
    assertValid({ startDate: 'The start date must be on or before the next payment.' });
  }
}
