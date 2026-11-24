import { describe, expect, inject, it } from 'vitest';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

/*
 * Runs the real seed script (`npm run seed`) as a separate process against
 * the in-memory test MongoDB, and checks its exit code — the number a
 * terminal or CI pipeline uses to decide whether it succeeded.
 */
const serverDir = fileURLToPath(new URL('..', import.meta.url));

function runSeed(mongoUri) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['src/utils/seed.js'], {
      cwd: serverDir,
      env: { ...process.env, MONGODB_URI: mongoUri },
    });
    let output = '';
    child.stdout.on('data', (d) => (output += d));
    child.stderr.on('data', (d) => (output += d));
    child.on('close', (code) => resolve({ code, output }));
  });
}

const dbUri = (name) => `${inject('mongoUri')}${name}`;

describe('seed script', () => {
  it('exits 0 and creates the demo account with 8 subscriptions', async () => {
    const name = `seed_ok_${Date.now()}`;
    const { code, output } = await runSeed(dbUri(name));

    expect(code).toBe(0);
    expect(output).toContain('Successfully seeded 8 subscriptions');

    const db = mongoose.connection.client.db(name);
    const demo = await db.collection('users').findOne({ email: 'demo@subtrack.app' });
    expect(demo).not.toBeNull();
    expect(demo.password).toMatch(/^\$2[aby]\$/); // stored as a bcrypt hash
    expect(await db.collection('subscriptions').countDocuments({ user: demo._id })).toBe(8);
    await db.dropDatabase();
  });

  it('is safe to run twice: resets the demo data instead of duplicating it', async () => {
    const name = `seed_twice_${Date.now()}`;
    expect((await runSeed(dbUri(name))).code).toBe(0);
    expect((await runSeed(dbUri(name))).code).toBe(0);

    const db = mongoose.connection.client.db(name);
    expect(await db.collection('users').countDocuments()).toBe(1);
    expect(await db.collection('subscriptions').countDocuments()).toBe(8);
    await db.dropDatabase();
  });

  it('exits 1 when seeding fails part-way (the database rejects the inserts)', async () => {
    const name = `seed_fail_${Date.now()}`;
    // Make MongoDB itself reject every subscription insert, so the failure
    // happens inside the script's try block, after connecting successfully.
    const db = mongoose.connection.client.db(name);
    await db.createCollection('subscriptions', {
      validator: { $jsonSchema: { required: ['fieldThatNeverExists'] } },
    });

    const { code, output } = await runSeed(dbUri(name));

    expect(output).toContain('Error seeding database');
    expect(code).toBe(1);
    await db.dropDatabase();
  });

  it('exits 1 when the database is unreachable', async () => {
    // Port 1 has nothing listening; the driver gives up after its 10s timeout.
    const { code, output } = await runSeed('mongodb://127.0.0.1:1/subtrack');
    expect(output).toContain('Could not connect to MongoDB');
    expect(code).toBe(1);
  }, 30000);
});
