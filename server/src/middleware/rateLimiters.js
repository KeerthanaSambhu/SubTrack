import rateLimit from 'express-rate-limit';
import { sendFailure } from '../utils/respond.js';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/**
 * Builds a limiter that allows `limit` requests per IP address in each
 * 15-minute window, then answers 429 Too Many Requests.
 */
export function createRateLimiter(limit, message) {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit,
    standardHeaders: 'draft-7', // sends RateLimit-* headers so clients can see their budget
    legacyHeaders: false,
    handler: (req, res) => sendFailure(res, 429, message),
  });
}

export const DEFAULT_LIMITS = {
  // Login / register: strict, to slow down password guessing.
  auth: 20,
  // Everything else under /api: generous, just stops runaway scripts.
  api: 300,
};
