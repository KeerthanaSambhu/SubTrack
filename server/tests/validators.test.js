import { describe, expect, it } from 'vitest';
import { parseCalendarDate } from '../src/validators/helpers.js';
import { validateSubscription } from '../src/validators/subscriptionValidators.js';

describe('parseCalendarDate', () => {
  it('turns YYYY-MM-DD into midnight UTC', () => {
    expect(parseCalendarDate('2026-03-15').toISOString()).toBe('2026-03-15T00:00:00.000Z');
  });

  it('accepts a full ISO string by reading only the date part', () => {
    expect(parseCalendarDate('2026-03-15T18:30:00.000Z').toISOString()).toBe('2026-03-15T00:00:00.000Z');
  });

  it.each(['2026-02-31', '2026-13-01', '15/03/2026', '', null, 42, { $gt: '' }, '1969-12-31'])(
    'rejects %j',
    (value) => expect(parseCalendarDate(value)).toBeNull(),
  );

  it('accepts 29 Feb only in leap years', () => {
    expect(parseCalendarDate('2028-02-29')).not.toBeNull();
    expect(parseCalendarDate('2027-02-29')).toBeNull();
  });
});

describe('validateSubscription', () => {
  it('copies only known fields', () => {
    const data = validateSubscription({
      name: 'X',
      amount: 1,
      billingCycle: 'weekly',
      startDate: '2026-01-01',
      nextPaymentDate: '2026-01-08',
      user: 'someone-else',
      isAdmin: true,
    });
    expect(Object.keys(data).sort()).toEqual(['amount', 'billingCycle', 'name', 'nextPaymentDate', 'startDate']);
  });

  it('in partial mode validates only what was sent', () => {
    expect(validateSubscription({ notes: '  hi  ' }, { partial: true })).toEqual({ notes: 'hi' });
  });
});
