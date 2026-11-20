import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { signToken } from '../utils/token.js';
import { validateLogin, validateRegister } from '../validators/authValidators.js';

// Compared against when the email doesn't exist, so a login attempt takes the
// same time either way and doesn't reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('subtrack-timing-guard', 12);

// POST /api/auth/register
export async function register(req, res) {
  const data = validateRegister(req.body);

  if (await User.exists({ email: data.email })) {
    const message = 'An account with this email already exists.';
    throw new AppError(409, message, { email: message });
  }

  const user = await User.create(data);
  res.status(201).json({ token: signToken(user._id), user });
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = validateLogin(req.body);

  const user = await User.findOne({ email }).select('+password');
  const passwordMatches = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
  if (!user || !passwordMatches) {
    throw new AppError(401, 'That email and password combination is incorrect.');
  }

  res.json({ token: signToken(user._id), user });
}

// GET /api/auth/me
export async function getMe(req, res) {
  res.json({ user: req.user });
}
