import { Router } from 'express';
import { changePassword, updateProfile } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.patch('/me', updateProfile);
router.patch('/me/password', changePassword);

export default router;
