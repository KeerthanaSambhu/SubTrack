import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/*
 * A JWT is a signed note saying "this is user X, token version N".
 * The signature (HMAC-SHA256 with JWT_SECRET) means nobody can edit it
 * without the server noticing.
 */
export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), ver: user.tokenVersion || 0 }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    algorithm: 'HS256',
  });
}

export function verifyToken(token) {
  // Pinning the algorithm stops "alg: none" and algorithm-swap attacks.
  return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
}
