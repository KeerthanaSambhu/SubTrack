/*
 * Serverless (Vercel) readiness:
 *  - src/app.js default-exports a ready Express app (Vercel's entry point)
 *  - the MongoDB connection is opened lazily, shared and reused
 *  - a database outage becomes a clean 503, never a crashed process
 *
 * The shared test setup keeps a real in-memory connection open. To simulate
 * "not connected yet" we stub mongoose.connection.readyState and mongoose.connect,
 * so nothing here ever talks to a real or remote database.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import serverlessApp, { createApp } from '../src/app.js';

// readyState is a getter on Mongoose's Connection prototype. We shadow it on the
// shared connection object and delete the shadow afterwards, which restores the
// real getter exactly (vi.spyOn's restore leaves a stale copy behind).
const pretendDisconnected = () =>
  Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, get: () => 0 });

// Fresh copy of db.js (its connection cache starts empty). db.js imports no
// models, so re-importing it is safe; mongoose itself stays the same instance.
async function freshDb() {
  vi.resetModules();
  return import('../src/config/db.js');
}

let exitSpy;
beforeEach(() => {
  exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('process.exit must not be called');
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  delete mongoose.connection.readyState; // back to the real prototype getter
  vi.restoreAllMocks();
});

describe('Serverless entry point (src/app.js default export)', () => {
  it('is a ready Express app that serves the API without calling listen()', async () => {
    expect(typeof serverlessApp).toBe('function'); // Express apps are request handlers
    expect(typeof serverlessApp.use).toBe('function');
    const res = await request(serverlessApp).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { status: 'ok', database: 'connected' } });
  });

  it('uses the same routes and response format as createApp()', async () => {
    const res = await request(serverlessApp).get('/api/subscriptions');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(typeof res.body.message).toBe('string');
    expect((await request(serverlessApp).get('/api/nope')).status).toBe(404);
  });
});

describe('Database connection reuse (connectDatabase)', () => {
  it('reuses an already-open connection without reconnecting', async () => {
    const { connectDatabase } = await freshDb();
    const connect = vi.spyOn(mongoose, 'connect');
    const connection = await connectDatabase('mongodb://unused');
    expect(connection).toBe(mongoose.connection);
    expect(connect).not.toHaveBeenCalled();
  });

  it('concurrent first calls share one connection attempt, and later calls reuse it', async () => {
    const { connectDatabase } = await freshDb();
    pretendDisconnected();
    const connect = vi.spyOn(mongoose, 'connect').mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mongoose), 20)),
    );
    const results = await Promise.all([1, 2, 3].map(() => connectDatabase('mongodb://example')));
    await connectDatabase('mongodb://example'); // a "later request" on the same warm instance
    expect(connect).toHaveBeenCalledTimes(1);
    results.forEach((c) => expect(c).toBe(mongoose.connection));
  });

  it('uses a small connection pool suited to serverless instances', async () => {
    const { connectDatabase } = await freshDb();
    pretendDisconnected();
    const connect = vi.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
    await connectDatabase('mongodb://example');
    expect(connect).toHaveBeenCalledWith('mongodb://example', expect.objectContaining({ maxPoolSize: 10 }));
  });

  it('throws on failure (no process.exit) and retries on the next call', async () => {
    const { connectDatabase } = await freshDb();
    pretendDisconnected();
    const connect = vi.spyOn(mongoose, 'connect').mockRejectedValue(new Error('network down'));
    await expect(connectDatabase('mongodb://example')).rejects.toThrow('network down');
    await expect(connectDatabase('mongodb://example')).rejects.toThrow('network down');
    expect(connect).toHaveBeenCalledTimes(2); // a failed attempt is not cached
    expect(exitSpy).not.toHaveBeenCalled();
  });
});

/*
 * These use createApp(), which shares the real db.js module, so order matters:
 * the failure test (which leaves the cache empty) runs before the success test
 * (which leaves a resolved connection cached for the rest of this file).
 */
describe('Lazy connection inside the app', () => {
  it('database unavailable: routes answer 503 in the standard format, health still responds', async () => {
    pretendDisconnected();
    vi.spyOn(mongoose, 'connect').mockRejectedValue(new Error('network down'));
    const app = createApp();

    const res = await request(app).get('/api/subscriptions');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ success: false, message: expect.stringMatching(/temporarily unavailable/) });

    const login = await request(app).post('/api/auth/login').send({ email: 'a@b.co', password: 'x' });
    expect(login.status).toBe(503);

    const health = await request(app).get('/api/health');
    expect(health.status).toBe(200);
    expect(health.body.data).toEqual({ status: 'ok', database: 'disconnected' });

    expect((await request(app).get('/api/nope')).status).toBe(404); // unknown routes don't need the DB
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('not yet connected: the first request connects once, then requests proceed normally', async () => {
    pretendDisconnected();
    const connect = vi.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
    const app = createApp();

    const first = await request(app).get('/api/subscriptions');
    const second = await request(app).get('/api/users/me');
    expect(first.status).toBe(401); // passed the database gate, reached normal auth checks
    expect(second.status).toBe(401);
    expect(connect).toHaveBeenCalledTimes(1);
  });
});
