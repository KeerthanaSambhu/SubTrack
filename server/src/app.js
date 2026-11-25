import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import config from './config/index.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { createRateLimiter, DEFAULT_LIMITS } from './middleware/rateLimiters.js';
import { sendSuccess } from './utils/respond.js';

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

/*
 * Builds the Express app (without starting it), so tests can use it directly.
 *
 * Request pipeline, in order:
 *   security headers → CORS → JSON body → rate limits → routes → 404 → error handler
 *
 * `options.rateLimits` lets tests use small limits; normal runs use the defaults.
 */
export function createApp({ rateLimits = {} } = {}) {
  const limits = { ...DEFAULT_LIMITS, ...rateLimits };
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1); // correct client IPs for rate limiting behind a proxy
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Allow same-origin / server-to-server requests (no Origin header) and listed origins.
        if (!origin || config.clientOrigins.includes(origin)) return callback(null, true);
        return callback(null, false);
      },
    }),
  );
  app.use(express.json({ limit: '20kb' }));

  // Rate limits: a strict one for password endpoints, a general one for the whole API.
  const authLimiter = createRateLimiter(limits.auth, 'Too many attempts. Please wait a few minutes and try again.');
  app.use(['/api/auth/login', '/api/auth/register'], authLimiter);
  app.use('/api', createRateLimiter(limits.api, 'Too many requests. Please slow down and try again shortly.'));

  // Lets you (and hosting platforms) check the API and database are up.
  app.get('/api/health', (req, res) => {
    sendSuccess(res, { status: 'ok', database: DB_STATES[mongoose.connection.readyState] || 'unknown' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
