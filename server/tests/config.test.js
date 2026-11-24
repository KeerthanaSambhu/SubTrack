import { afterEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import config from '../src/config/index.js';
import User from '../src/models/User.js';
import { registerUser } from './helpers/api.js';

/** Loads a fresh copy of config/index.js with the given environment variables. */
async function loadConfig(env) {
  Object.entries(env).forEach(([key, value]) => vi.stubEnv(key, value));
  vi.resetModules();
  return (await import('../src/config/index.js')).default;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('bcrypt cost factor', () => {
  it('is 12 in production, even if BCRYPT_ROUNDS tries to lower it', async () => {
    const prod = await loadConfig({ NODE_ENV: 'production', BCRYPT_ROUNDS: '4' });
    expect(prod.bcryptRounds).toBe(12);
  });

  it('is 12 in development, even if BCRYPT_ROUNDS tries to lower it', async () => {
    const dev = await loadConfig({ NODE_ENV: 'development', BCRYPT_ROUNDS: '4' });
    expect(dev.bcryptRounds).toBe(12);
  });

  it('is 12 when NODE_ENV is not set at all', async () => {
    const unset = await loadConfig({ NODE_ENV: '', BCRYPT_ROUNDS: '4' });
    expect(unset.env).toBe('development');
    expect(unset.bcryptRounds).toBe(12);
  });

  it('may be lowered only in the test environment, never below 4', async () => {
    expect((await loadConfig({ NODE_ENV: 'test', BCRYPT_ROUNDS: '4' })).bcryptRounds).toBe(4);
    expect((await loadConfig({ NODE_ENV: 'test', BCRYPT_ROUNDS: '2' })).bcryptRounds).toBe(12);
    expect((await loadConfig({ NODE_ENV: 'test', BCRYPT_ROUNDS: 'abc' })).bcryptRounds).toBe(12);
  });

  it('stored hashes really use the configured cost', async () => {
    const { user } = await registerUser();
    const stored = await User.findById(user.id).select('+password');
    expect(bcrypt.getRounds(stored.password)).toBe(config.bcryptRounds);
  });
});
