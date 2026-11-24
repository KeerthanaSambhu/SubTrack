import bcrypt from 'bcryptjs';
import config from '../config/index.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { sendSuccess } from '../utils/respond.js';
import { signToken } from '../utils/token.js';
import { validateLogin, validateRegister } from '../validators/authValidators.js';

// Compared against when the email doesn't exist, so a login attempt takes the
// same time either way and doesn't reveal which emails are registered.
// Uses the same cost factor as real hashes so the timing really matches.
const DUMMY_HASH = bcrypt.hashSync('subtrack-timing-guard', config.bcryptRounds);

// POST /api/auth/register — create an account and sign the user in.
export async function register(req, res) {
  const data = validateRegister(req.body);

  if (await User.exists({ email: data.email })) {
    const message = 'An account with this email already exists.';
    throw new AppError(409, message, { email: message });
  }

  const user = await User.create(data); // password is hashed by the model's pre-save hook
  sendSuccess(res, { user, token: signToken(user) }, { status: 201, message: 'Account created.' });
}

// POST /api/auth/login — check email + password, then issue a token.
export async function login(req, res) {
  const { email, password } = validateLogin(req.body);

  const user = await User.findOne({ email }).select('+password +tokenVersion');
  const passwordMatches = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
  if (!user || !passwordMatches) {
    // Same message for "no such email" and "wrong password" on purpose.
    throw new AppError(401, 'That email and password combination is incorrect.');
  }

  sendSuccess(res, { user, token: signToken(user) });
}

// GET /api/auth/me — who am I? (used to restore a session on page load)
export async function getMe(req, res) {
  sendSuccess(res, { user: req.user });
}
