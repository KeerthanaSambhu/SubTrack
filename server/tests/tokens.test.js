import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';
import { signToken } from '../src/utils/token.js';
import { api, registerUser, VALID_PASSWORD } from './helpers/api.js';

const versionInDb = async (id) => (await User.findById(id).select('+tokenVersion')).tokenVersion;
const changePassword = (auth, currentPassword, newPassword) =>
  auth(api().patch('/api/users/me/password')).send({ currentPassword, newPassword });

describe('tokenVersion', () => {
  it('starts at 0 and the registration token carries ver 0', async () => {
    const { user, token } = await registerUser();
    expect(await versionInDb(user.id)).toBe(0);
    expect(jwt.decode(token)).toMatchObject({ sub: user.id, ver: 0 });
  });

  it('increments by exactly one per password change', async () => {
    const { user, auth } = await registerUser();

    const first = await changePassword(auth, VALID_PASSWORD, 'NewPass456');
    expect(first.status).toBe(200);
    expect(await versionInDb(user.id)).toBe(1);

    const withFresh = (req) => req.set('Authorization', `Bearer ${first.body.data.token}`);
    const second = await changePassword(withFresh, 'NewPass456', 'Another789');
    expect(second.status).toBe(200);
    expect(await versionInDb(user.id)).toBe(2);
  });

  it('does not change on saves that leave the password alone', async () => {
    const { user, auth } = await registerUser();
    await auth(api().patch('/api/users/me')).send({ name: 'Renamed', currency: 'USD' });
    expect(await versionInDb(user.id)).toBe(0);
  });

  it('does not change when the current password is wrong', async () => {
    const { user, auth } = await registerUser();
    const res = await changePassword(auth, 'WrongPass1', 'NewPass456');
    expect(res.status).toBe(400);
    expect(await versionInDb(user.id)).toBe(0);
  });

  it('new login and password-change tokens carry the current version', async () => {
    const { user, auth, email } = await registerUser();
    const changed = await changePassword(auth, VALID_PASSWORD, 'NewPass456');
    expect(jwt.decode(changed.body.data.token).ver).toBe(1);

    const login = await api().post('/api/auth/login').send({ email, password: 'NewPass456' });
    expect(jwt.decode(login.body.data.token)).toMatchObject({ sub: user.id, ver: 1 });
    expect((await api().get('/api/auth/me').set('Authorization', `Bearer ${login.body.data.token}`)).status).toBe(200);
  });

  it('rejects every older token immediately after a password change', async () => {
    const { auth, email } = await registerUser();
    // A second device logged in before the change.
    const otherDevice = (await api().post('/api/auth/login').send({ email, password: VALID_PASSWORD })).body.data.token;

    await changePassword(auth, VALID_PASSWORD, 'NewPass456');

    const fromRegistration = await auth(api().get('/api/auth/me'));
    const fromOtherDevice = await api().get('/api/auth/me').set('Authorization', `Bearer ${otherDevice}`);
    expect(fromRegistration.status).toBe(401);
    expect(fromOtherDevice.status).toBe(401);
    expect(fromOtherDevice.body).toEqual({ success: false, message: 'Your password was changed. Please log in again.' });
  });

  it('rejects a validly signed token that has no version (old format)', async () => {
    const { user } = await registerUser();
    const legacy = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
    expect((await api().get('/api/auth/me').set('Authorization', `Bearer ${legacy}`)).status).toBe(401);
  });

  it('signToken refuses a user loaded without tokenVersion', async () => {
    const { user } = await registerUser();
    const withoutVersion = await User.findById(user.id); // tokenVersion not selected
    expect(() => signToken(withoutVersion)).toThrow(/tokenVersion/);
  });
});
