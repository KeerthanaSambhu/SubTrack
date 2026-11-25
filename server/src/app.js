import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import config from './config/index.js';
import { connectDatabase } from './config/db.js';
import AppError from './utils/AppError.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { createRateLimiter, DEFAULT_LIMITS } from './middleware/rateLimiters.js';
import { sendSuccess } from './utils/respond.js';

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

/*
 * Makes sure MongoDB is connected before a route that needs it runs.
 * Locally (server.js) the connection is already open, so this does nothing.
 * On Vercel it opens the shared connection on the first request and reuses it.
 */
async function requireDatabase(req, res, next) {
  if (mongoose.connection.readyState === 1) return next();
  try {
    await connectDatabase(config.mongoUri);
  } catch {
    throw new AppError(503, 'The service is temporarily unavailable. Please try again shortly.');
  }
  next();
}

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
  // It also tries to connect first, so on Vercel it reports the real database state.
  app.get('/api/health', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
      await connectDatabase(config.mongoUri).catch(() => {}); // state below shows the outcome
    }
    sendSuccess(res, { status: 'ok', database: DB_STATES[mongoose.connection.readyState] || 'unknown' });
  });

  app.use('/api/auth', requireDatabase, authRoutes);
  app.use('/api/users', requireDatabase, userRoutes);
  app.use('/api/subscriptions', requireDatabase, subscriptionRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

/*
 * Ready-to-use app instance. Vercel detects this file (src/app.js imports
 * express) and serves this default export as a single serverless function.
 * Local development still starts through server.js, and tests use createApp().
 */
const app = createApp();
export default app;
