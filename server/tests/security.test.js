import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { api, registerUser } from './helpers/api.js';

describe('NoSQL injection', () => {
  it('rejects MongoDB operators instead of strings at login', async () => {
    await registerUser({ email: 'victim@example.com' });
    // Classic attack: {"$gt": ""} matches any value if passed straight to a query.
    const res = await api().post('/api/auth/login').send({ email: 'victim@example.com', password: { $gt: '' } });
    expect(res.status).toBe(400);
    expect(res.body.data).toBeUndefined();
  });

  it('rejects an operator object as the email', async () => {
    const res = await api().post('/api/auth/login').send({ email: { $ne: null }, password: 'x' });
    expect(res.status).toBe(400);
  });
});

describe('Consistent responses and error handling', () => {
  it('unknown routes return the standard failure shape', async () => {
    const res = await api().get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: expect.any(String) });
  });

  it('malformed JSON returns 400, not a crash', async () => {
    const res = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('oversized bodies are rejected with 413', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'a@b.co', password: 'x'.repeat(30000) });
    expect(res.status).toBe(413);
  });

  it('health check reports the database connection', async () => {
    const res = await api().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ status: 'ok', database: 'connected' });
  });

  it('sets security headers and hides the framework', async () => {
    const res = await api().get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('Rate limiting', () => {
  it('blocks repeated login attempts with 429', async () => {
    const strictApp = createApp({ rateLimits: { auth: 3 } });
    const attempt = () => request(strictApp).post('/api/auth/login').send({ email: 'x@example.com', password: 'Wrong1234' });

    for (let i = 0; i < 3; i += 1) expect((await attempt()).status).toBe(401);
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body.success).toBe(false);
  });

  it('applies a general limit to the rest of the API', async () => {
    const strictApp = createApp({ rateLimits: { api: 2 } });
    await request(strictApp).get('/api/health');
    await request(strictApp).get('/api/health');
    expect((await request(strictApp).get('/api/health')).status).toBe(429);
  });
});
