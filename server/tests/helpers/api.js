import request from 'supertest';
import { createApp } from '../../src/app.js';

export const app = createApp();
export const api = () => request(app);

export const VALID_PASSWORD = 'Password123';

let counter = 0;

/** Registers a fresh user and returns { user, token, auth } where auth() sets the login header. */
export async function registerUser(overrides = {}) {
  counter += 1;
  const body = {
    name: 'Test User',
    email: `user${counter}-${Date.now()}@example.com`,
    password: VALID_PASSWORD,
    ...overrides,
  };
  const res = await api().post('/api/auth/register').send(body);
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  const { token, user } = res.body.data;
  // Phase B moves login to an httpOnly cookie; only this helper will need to change.
  const auth = (req) => req.set('Authorization', `Bearer ${token}`);
  return { user, token, auth, password: body.password, email: body.email };
}

export function validSubscription(overrides = {}) {
  return {
    name: 'Netflix',
    amount: 649,
    currency: 'INR',
    category: 'entertainment',
    billingCycle: 'monthly',
    startDate: '2026-01-15',
    nextPaymentDate: '2026-12-15',
    ...overrides,
  };
}
