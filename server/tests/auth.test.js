import { describe, expect, it } from 'vitest';
import User from '../src/models/User.js';
import { api, registerUser, VALID_PASSWORD } from './helpers/api.js';

describe('POST /api/auth/register', () => {
  it('creates an account and returns the user plus a token', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ name: '  Priya  ', email: 'Priya@Example.com', password: VALID_PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ name: 'Priya', email: 'priya@example.com', currency: 'INR' });
  });

  it('stores a bcrypt hash, never the plain password', async () => {
    await api().post('/api/auth/register').send({ name: 'A', email: 'a@example.com', password: VALID_PASSWORD });
    const stored = await User.findOne({ email: 'a@example.com' }).select('+password');

    expect(stored.password).not.toBe(VALID_PASSWORD);
    expect(stored.password).toMatch(/^\$2[aby]\$/); // bcrypt hash prefix
  });

  it('never sends the password hash back to the client', async () => {
    const res = await api().post('/api/auth/register').send({ name: 'A', email: 'b@example.com', password: VALID_PASSWORD });
    expect(JSON.stringify(res.body)).not.toMatch(/password|tokenVersion/i);
  });

  it('rejects a duplicate email with 409', async () => {
    const { email } = await registerUser();
    const res = await api().post('/api/auth/register').send({ name: 'Dup', email: email.toUpperCase(), password: VALID_PASSWORD });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ success: false, errors: { email: expect.any(String) } });
  });

  it('returns per-field errors for invalid input', async () => {
    const res = await api().post('/api/auth/register').send({ name: '', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Object.keys(res.body.errors).sort()).toEqual(['email', 'name', 'password']);
  });

  it('requires a letter and a number in the password', async () => {
    const res = await api().post('/api/auth/register').send({ name: 'A', email: 'c@example.com', password: 'onlyletters' });
    expect(res.status).toBe(400);
    expect(res.body.errors.password).toBeDefined();
  });
});

describe('POST /api/auth/login', () => {
  it('signs in with the right email and password', async () => {
    const { email } = await registerUser();
    const res = await api().post('/api/auth/login').send({ email, password: VALID_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  it('gives the same 401 message for a wrong password and an unknown email', async () => {
    const { email } = await registerUser();
    const wrongPassword = await api().post('/api/auth/login').send({ email, password: 'WrongPass1' });
    const unknownEmail = await api().post('/api/auth/login').send({ email: 'nobody@example.com', password: 'WrongPass1' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the signed-in user', async () => {
    const { auth, email } = await registerUser();
    const res = await auth(api().get('/api/auth/me'));

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(email);
  });

  it('rejects requests without a token', async () => {
    const res = await api().get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects a tampered token', async () => {
    const { token } = await registerUser();
    const tampered = `${token.slice(0, -2)}xx`;
    const res = await api().get('/api/auth/me').set('Authorization', `Bearer ${tampered}`);
    expect(res.status).toBe(401);
  });

  it('rejects a token for an account that was deleted', async () => {
    const { auth, user } = await registerUser();
    await User.deleteOne({ _id: user.id });
    const res = await auth(api().get('/api/auth/me'));
    expect(res.status).toBe(401);
  });
});
