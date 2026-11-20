import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/index.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

/*
 * Builds the Express app (without starting it), so it can also be
 * used directly in tests.
 */
export function createApp() {
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

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
