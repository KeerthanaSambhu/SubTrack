import { Router } from 'express';
import {
  createSubscription,
  deleteSubscription,
  getSubscription,
  listSubscriptions,
  updateSubscription,
} from '../controllers/subscriptionController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Every subscription route requires a signed-in user.
router.use(requireAuth);

router.route('/').get(listSubscriptions).post(createSubscription);
router.route('/:id').get(getSubscription).patch(updateSubscription).delete(deleteSubscription);

export default router;
