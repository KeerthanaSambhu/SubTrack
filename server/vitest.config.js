import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Fake values so config/index.js loads. The real database is never used:
    // tests/setup.js connects to a throwaway in-memory MongoDB instead.
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://unused-in-tests',
      JWT_SECRET: 'test-secret-that-is-definitely-at-least-32-characters',
      BCRYPT_ROUNDS: '4', // fast hashing for tests only (production always uses 12)
    },
    globalSetup: ['./tests/globalSetup.js'],
    setupFiles: ['./tests/setup.js'],
    testTimeout: 20000,
    hookTimeout: 120000, // the first run downloads a MongoDB binary
  },
});
