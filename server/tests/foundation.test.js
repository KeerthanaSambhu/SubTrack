import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import Subscription from '../src/models/Subscription.js';
import User from '../src/models/User.js';
import { api, registerUser, validSubscription } from './helpers/api.js';

/* ------------------------------------------------------------------ */
/* Response format                                                     */
/* ------------------------------------------------------------------ */

function expectSuccessShape(res) {
  expect(res.body.success).toBe(true);
  expect(res.body.data).toBeTypeOf('object');
  expect(Object.keys(res.body).every((k) => ['success', 'data', 'message'].includes(k))).toBe(true);
}

function expectFailureShape(res) {
  expect(res.body.success).toBe(false);
  expect(res.body.message).toBeTypeOf('string');
  expect(res.body.data).toBeUndefined();
  expect(Object.keys(res.body).every((k) => ['success', 'message', 'errors', 'detail'].includes(k))).toBe(true);
}

describe('Every endpoint uses the agreed response format', () => {
  it('success responses: { success: true, data, message? }', async () => {
    const { auth } = await registerUser();
    const created = await auth(api().post('/api/subscriptions')).send(validSubscription());
    const id = created.body.data.subscription.id;

    const responses = [
      created,
      await api().get('/api/health'),
      await auth(api().get('/api/auth/me')),
      await auth(api().patch('/api/users/me')).send({ name: 'X' }),
      await auth(api().get('/api/subscriptions')),
      await auth(api().get(`/api/subscriptions/${id}`)),
      await auth(api().patch(`/api/subscriptions/${id}`)).send({ amount: 5 }),
      await auth(api().delete(`/api/subscriptions/${id}`)),
    ];
    responses.forEach((res) => {
      expect(res.status).toBeLessThan(300);
      expectSuccessShape(res);
    });
  });

  it('failure responses: { success: false, message, errors? } for 400/401/404/409/413/429', async () => {
    const { auth, email } = await registerUser();
    const limited = createApp({ rateLimits: { auth: 1 } });
    await request(limited).post('/api/auth/login').send({});

    const responses = [
      [400, await api().post('/api/auth/register').send({})],
      [400, await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{bad')],
      [401, await api().get('/api/auth/me')],
      [404, await auth(api().get('/api/subscriptions/64b000000000000000000000'))],
      [404, await api().get('/api/nope')],
      [409, await api().post('/api/auth/register').send({ name: 'A', email, password: 'Password123' })],
      [413, await api().post('/api/auth/login').send({ email: 'x'.repeat(30000) })],
      [429, await request(limited).post('/api/auth/login').send({})],
    ];
    responses.forEach(([status, res]) => {
      expect(res.status).toBe(status);
      expectFailureShape(res);
    });
  });

  it('unexpected errors become a 500 with the failure shape and no stack trace', () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    vi.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(new Error('database exploded'), {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body).toMatchObject({ success: false, message: expect.any(String) });
    expect(JSON.stringify(body)).not.toMatch(/at .*\.js/); // no stack trace
    vi.restoreAllMocks();
  });
});

/* ------------------------------------------------------------------ */
/* Rate limiters working together                                      */
/* ------------------------------------------------------------------ */

describe('Rate limiters', () => {
  it('the strict auth limiter blocks login without blocking the rest of the API', async () => {
    const app = createApp({ rateLimits: { auth: 2, api: 100 } });
    const login = () => request(app).post('/api/auth/login').send({ email: 'x@example.com', password: 'Wrong1234' });

    expect((await login()).status).toBe(401);
    expect((await login()).status).toBe(401);
    expect((await login()).status).toBe(429); // auth limit reached
    expect((await request(app).post('/api/auth/register').send({})).status).toBe(429); // register shares it
    expect((await request(app).get('/api/health')).status).toBe(200); // rest of API unaffected
  });

  it('the general limiter counts requests to every /api route', async () => {
    const app = createApp({ rateLimits: { auth: 100, api: 3 } });
    expect((await request(app).get('/api/health')).status).toBe(200);
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/nope')).status).toBe(404);
    const blocked = await request(app).get('/api/subscriptions');
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toMatch(/Too many requests/);
  });

  it('sends standard RateLimit headers', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.headers.ratelimit).toMatch(/limit=300/);
  });
});

/* ------------------------------------------------------------------ */
/* Database indexes                                                    */
/* ------------------------------------------------------------------ */

describe('Indexes', () => {
  it('subscriptions have exactly the two compound indexes (plus _id)', async () => {
    const indexes = await Subscription.collection.indexes();
    expect(indexes.map((i) => i.key)).toEqual([
      { _id: 1 },
      { user: 1, createdAt: -1 },
      { user: 1, status: 1, nextPaymentDate: 1 },
    ]);
  });

  it('users have a unique index on email', async () => {
    const emailIndex = (await User.collection.indexes()).find((i) => i.key.email === 1);
    expect(emailIndex.unique).toBe(true);
  });

  it.each([
    ['list (newest first)', () => Subscription.find({ user: new mongoose.Types.ObjectId() }).sort({ createdAt: -1 }), 'user_1_createdAt_-1'],
    ['upcoming active payments', () => Subscription.find({ user: new mongoose.Types.ObjectId(), status: 'active' }).sort({ nextPaymentDate: 1 }), 'user_1_status_1_nextPaymentDate_1'],
  ])('the %s query uses an index, not a collection scan', async (_label, query, indexName) => {
    const plan = JSON.stringify((await query().explain()).queryPlanner);
    expect(plan).toContain(indexName);
    expect(plan).not.toContain('COLLSCAN');
  });
});
