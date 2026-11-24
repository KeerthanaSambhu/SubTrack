import { describe, expect, it } from 'vitest';
import { api, registerUser, VALID_PASSWORD } from './helpers/api.js';

describe('PATCH /api/users/me', () => {
  it('updates name, email and currency', async () => {
    const { auth } = await registerUser();
    const res = await auth(api().patch('/api/users/me')).send({ name: 'New Name', email: 'NEW@example.com', currency: 'USD' });

    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ name: 'New Name', email: 'new@example.com', currency: 'USD' });
  });

  it("won't take another user's email", async () => {
    const first = await registerUser();
    const second = await registerUser();
    const res = await second.auth(api().patch('/api/users/me')).send({ email: first.email });

    expect(res.status).toBe(409);
    expect(res.body.errors.email).toBeDefined();
  });

  it('rejects an unsupported currency', async () => {
    const { auth } = await registerUser();
    const res = await auth(api().patch('/api/users/me')).send({ currency: 'BTC' });
    expect(res.status).toBe(400);
    expect(res.body.errors.currency).toBeDefined();
  });

  it('rejects an empty update', async () => {
    const { auth } = await registerUser();
    const res = await auth(api().patch('/api/users/me')).send({});
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/users/me/password', () => {
  it('requires the correct current password', async () => {
    const { auth } = await registerUser();
    const res = await auth(api().patch('/api/users/me/password')).send({ currentPassword: 'WrongPass1', newPassword: 'NewPass456' });

    expect(res.status).toBe(400);
    expect(res.body.errors.currentPassword).toBeDefined();
  });

  it('changes the password, so only the new one logs in', async () => {
    const { auth, email } = await registerUser();
    const res = await auth(api().patch('/api/users/me/password')).send({ currentPassword: VALID_PASSWORD, newPassword: 'NewPass456' });
    expect(res.status).toBe(200);

    const oldLogin = await api().post('/api/auth/login').send({ email, password: VALID_PASSWORD });
    const newLogin = await api().post('/api/auth/login').send({ email, password: 'NewPass456' });
    expect(oldLogin.status).toBe(401);
    expect(newLogin.status).toBe(200);
  });

  it('invalidates older tokens immediately, even within the same second', async () => {
    const { auth } = await registerUser();
    const res = await auth(api().patch('/api/users/me/password')).send({ currentPassword: VALID_PASSWORD, newPassword: 'NewPass456' });

    // The token from registration must stop working straight away...
    const withOldToken = await auth(api().get('/api/auth/me'));
    expect(withOldToken.status).toBe(401);

    // ...while the fresh token returned by the password change works.
    const withNewToken = await api().get('/api/auth/me').set('Authorization', `Bearer ${res.body.data.token}`);
    expect(withNewToken.status).toBe(200);
  });
});
