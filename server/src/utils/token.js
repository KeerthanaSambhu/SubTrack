import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export function signToken(userId) {
  return jwt.sign({ sub: userId.toString() }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    algorithm: 'HS256',
  });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
}
