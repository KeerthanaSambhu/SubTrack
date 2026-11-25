/*
 * Runs before every test file:
 *  - connects to the shared in-memory MongoDB (nothing touches Atlas or your data),
 *    using a database name unique to this file so files can run in parallel
 *  - empties every collection after each test, so tests can't affect each other
 */
import { afterAll, afterEach, beforeAll, inject } from 'vitest';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Subscription from '../src/models/Subscription.js';

beforeAll(async () => {
  const dbName = `test_${process.pid}_${Math.random().toString(36).slice(2, 8)}`;
  await mongoose.connect(inject('mongoUri'), { dbName });
  // Build indexes up front so unique-email checks behave like production.
  await Promise.all([User.init(), Subscription.init()]);
});

afterEach(async () => {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
