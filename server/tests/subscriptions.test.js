import { describe, expect, it } from 'vitest';
import Subscription from '../src/models/Subscription.js';
import { api, registerUser, validSubscription } from './helpers/api.js';

async function createSub(auth, overrides) {
  const res = await auth(api().post('/api/subscriptions')).send(validSubscription(overrides));
  expect(res.status).toBe(201);
  return res.body.data.subscription;
}

describe('Subscription CRUD', () => {
  it('Create: adds a subscription with defaults filled in', async () => {
    const { auth } = await registerUser();
    const res = await auth(api().post('/api/subscriptions')).send({
      name: '  Spotify ',
      amount: '119.999',
      billingCycle: 'monthly',
      startDate: '2026-01-01',
      nextPaymentDate: '2026-12-01',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.subscription).toMatchObject({
      id: expect.any(String),
      name: 'Spotify',
      amount: 120, // rounded to 2 decimals
      currency: 'INR', // the user's preferred currency
      category: 'other',
      status: 'active',
      startDate: '2026-01-01T00:00:00.000Z',
    });
    expect(res.body.data.subscription.user).toBeUndefined(); // owner id isn't exposed
  });

  it('Read: lists only my subscriptions, newest first', async () => {
    const { auth } = await registerUser();
    await createSub(auth, { name: 'First' });
    await createSub(auth, { name: 'Second' });

    const res = await auth(api().get('/api/subscriptions'));
    expect(res.status).toBe(200);
    expect(res.body.data.subscriptions.map((s) => s.name)).toEqual(['Second', 'First']);
  });

  it('Read: gets one subscription by id', async () => {
    const { auth } = await registerUser();
    const sub = await createSub(auth);
    const res = await auth(api().get(`/api/subscriptions/${sub.id}`));
    expect(res.status).toBe(200);
    expect(res.body.data.subscription.id).toBe(sub.id);
  });

  it('Update: changes only the fields sent', async () => {
    const { auth } = await registerUser();
    const sub = await createSub(auth);
    const res = await auth(api().patch(`/api/subscriptions/${sub.id}`)).send({ amount: 799, status: 'paused' });

    expect(res.status).toBe(200);
    expect(res.body.data.subscription).toMatchObject({ name: 'Netflix', amount: 799, status: 'paused' });
    expect(new Date(res.body.data.subscription.statusChangedAt).getTime()).toBeGreaterThan(0);
  });

  it('Update: keeps start date on or before next payment date', async () => {
    const { auth } = await registerUser();
    const sub = await createSub(auth);
    const res = await auth(api().patch(`/api/subscriptions/${sub.id}`)).send({ startDate: '2027-06-01' });
    expect(res.status).toBe(400);
    expect(res.body.errors.startDate).toBeDefined();
  });

  it('Delete: removes the subscription', async () => {
    const { auth } = await registerUser();
    const sub = await createSub(auth);
    const res = await auth(api().delete(`/api/subscriptions/${sub.id}`));

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(sub.id);
    expect(await Subscription.countDocuments()).toBe(0);
  });

  it('returns 404 for an id that is not a valid ObjectId', async () => {
    const { auth } = await registerUser();
    const res = await auth(api().get('/api/subscriptions/not-an-id'));
    expect(res.status).toBe(404);
  });
});

describe('Subscription validation', () => {
  it.each([
    ['missing name', { name: '' }, 'name'],
    ['zero amount', { amount: 0 }, 'amount'],
    ['negative amount', { amount: -5 }, 'amount'],
    ['unknown billing cycle', { billingCycle: 'daily' }, 'billingCycle'],
    ['unknown category', { category: 'gaming' }, 'category'],
    ['unsupported currency', { currency: 'BTC' }, 'currency'],
    ['impossible date', { nextPaymentDate: '2026-02-31' }, 'nextPaymentDate'],
    ['start after next payment', { startDate: '2027-01-01', nextPaymentDate: '2026-01-01' }, 'startDate'],
    ['notes too long', { notes: 'x'.repeat(501) }, 'notes'],
  ])('rejects %s', async (_label, overrides, field) => {
    const { auth } = await registerUser();
    const res = await auth(api().post('/api/subscriptions')).send(validSubscription(overrides));
    expect(res.status).toBe(400);
    expect(res.body.errors[field]).toBeDefined();
  });
});

describe('Data isolation between users', () => {
  it("one user can't see, change or delete another user's subscription", async () => {
    const alice = await registerUser({ name: 'Alice' });
    const bob = await registerUser({ name: 'Bob' });
    const alicesSub = await createSub(alice.auth);

    const list = await bob.auth(api().get('/api/subscriptions'));
    expect(list.body.data.subscriptions).toHaveLength(0);

    // Same 404 as a missing record, so Bob can't even tell it exists.
    expect((await bob.auth(api().get(`/api/subscriptions/${alicesSub.id}`))).status).toBe(404);
    expect((await bob.auth(api().patch(`/api/subscriptions/${alicesSub.id}`)).send({ amount: 1 })).status).toBe(404);
    expect((await bob.auth(api().delete(`/api/subscriptions/${alicesSub.id}`))).status).toBe(404);

    const stillThere = await Subscription.findById(alicesSub.id);
    expect(stillThere.amount).toBe(649);
  });

  it("ignores attempts to set the owner or id from the request body", async () => {
    const alice = await registerUser();
    const bob = await registerUser();
    const res = await alice.auth(api().post('/api/subscriptions')).send(validSubscription({ user: bob.user.id, _id: '64b000000000000000000000' }));

    expect(res.status).toBe(201);
    const saved = await Subscription.findById(res.body.data.subscription.id);
    expect(saved.user.toString()).toBe(alice.user.id);
    expect(saved.id).not.toBe('64b000000000000000000000');
  });

  it('requires login for every subscription route', async () => {
    const responses = await Promise.all([
      api().get('/api/subscriptions'),
      api().post('/api/subscriptions').send(validSubscription()),
      api().get('/api/subscriptions/64b000000000000000000000'),
      api().patch('/api/subscriptions/64b000000000000000000000').send({}),
      api().delete('/api/subscriptions/64b000000000000000000000'),
    ]);
    responses.forEach((res) => expect(res.status).toBe(401));
  });
});
