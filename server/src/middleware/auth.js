import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { verifyToken } from '../utils/token.js';

/**
 * Protects a route: requires a valid "Authorization: Bearer <token>" header.
 * On success the signed-in user's document is available as req.user, and
 * controllers use req.user._id to scope every database query to that user.
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, 'Please log in to continue.');
  }

  let payload;
  try {
    payload = verifyToken(token); // checks signature and expiry
  } catch {
    throw new AppError(401, 'Your session has expired. Please log in again.');
  }

  const user = await User.findById(payload.sub).select('+tokenVersion');
  if (!user) throw new AppError(401, 'This account no longer exists.');
  if ((payload.ver ?? 0) !== user.tokenVersion) {
    throw new AppError(401, 'Your password was changed. Please log in again.');
  }

  req.user = user;
  next();
}
