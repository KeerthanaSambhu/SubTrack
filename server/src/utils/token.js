import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/*
 * A JWT is a signed note saying "this is user X, token version N".
 * The signature (HMAC-SHA256 with JWT_SECRET) means nobody can edit it
 * without the server noticing.
 */
export function signToken(user) {
  // tokenVersion is hidden by default (select: false). Signing without it would
  // silently produce a token that never works, so fail loudly instead.
  if (!Number.isInteger(user.tokenVersion)) {
    throw new Error("signToken: load the user with .select('+tokenVersion') first");
  }
  return jwt.sign({ sub: user._id.toString(), ver: user.tokenVersion }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    algorithm: 'HS256',
  });
}

export function verifyToken(token) {
  // Pinning the algorithm stops "alg: none" and algorithm-swap attacks.
  return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
}
