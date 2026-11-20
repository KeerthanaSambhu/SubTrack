import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getMe, login, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Slow down password guessing: 20 attempts per 15 minutes per IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait a few minutes and try again.' },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', requireAuth, getMe);

export default router;
