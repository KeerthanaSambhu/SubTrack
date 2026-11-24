import mongoose from 'mongoose';
import Subscription from '../models/Subscription.js';
import AppError from '../utils/AppError.js';
import { sendSuccess } from '../utils/respond.js';
import { assertDatesInOrder, validateSubscription } from '../validators/subscriptionValidators.js';

/**
 * Loads a subscription that belongs to the signed-in user.
 * Someone else's subscription gives the same 404 as a missing one,
 * so ids can't be probed.
 */
async function findOwned(req) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new AppError(404, 'Subscription not found.');
  const subscription = await Subscription.findOne({ _id: id, user: req.user._id });
  if (!subscription) throw new AppError(404, 'Subscription not found.');
  return subscription;
}

// GET /api/subscriptions
export async function listSubscriptions(req, res) {
  const subscriptions = await Subscription.find({ user: req.user._id }).sort({ createdAt: -1 });
  sendSuccess(res, { subscriptions });
}

// GET /api/subscriptions/:id
export async function getSubscription(req, res) {
  sendSuccess(res, { subscription: await findOwned(req) });
}

// POST /api/subscriptions
export async function createSubscription(req, res) {
  const data = validateSubscription(req.body);
  assertDatesInOrder(data.startDate, data.nextPaymentDate);

  const subscription = await Subscription.create({
    currency: req.user.currency,
    ...data,
    user: req.user._id,
  });
  sendSuccess(res, { subscription }, { status: 201, message: 'Subscription added.' });
}

// PATCH /api/subscriptions/:id
export async function updateSubscription(req, res) {
  const data = validateSubscription(req.body, { partial: true });
  const subscription = await findOwned(req);

  Object.assign(subscription, data);
  assertDatesInOrder(subscription.startDate, subscription.nextPaymentDate);
  await subscription.save();

  sendSuccess(res, { subscription }, { message: 'Subscription updated.' });
}

// DELETE /api/subscriptions/:id
export async function deleteSubscription(req, res) {
  const subscription = await findOwned(req);
  await subscription.deleteOne();
  sendSuccess(res, { id: subscription.id }, { message: 'Subscription deleted.' });
}
