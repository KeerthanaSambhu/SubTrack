import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { verifyToken } from '../utils/token.js';

/**
 * Requires a valid "Authorization: Bearer <token>" header.
 * On success, the signed-in user is available as req.user.
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, 'Please log in to continue.');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new AppError(401, 'Your session has expired. Please log in again.');
  }

  const user = await User.findById(payload.sub).select('+passwordChangedAt');
  if (!user) throw new AppError(401, 'This account no longer exists.');
  if (user.changedPasswordAfter(payload.iat)) {
    throw new AppError(401, 'Your password was changed. Please log in again.');
  }

  req.user = user;
  next();
}
