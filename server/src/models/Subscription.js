import mongoose from 'mongoose';
import { BILLING_CYCLES, CATEGORIES, CURRENCIES, DEFAULT_CURRENCY, STATUSES } from '../utils/constants.js';

const subscriptionSchema = new mongoose.Schema(
  {
    // Owner — every query filters by this, so users only see their own data.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    amount: { type: Number, required: true, min: 0.01, max: 10000000 },
    currency: { type: String, enum: CURRENCIES, default: DEFAULT_CURRENCY },
    category: { type: String, enum: CATEGORIES, default: 'other' },
    billingCycle: { type: String, enum: BILLING_CYCLES, required: true },
    // Calendar dates, stored as midnight UTC.
    startDate: { type: Date, required: true },
    nextPaymentDate: { type: Date, required: true },
    status: { type: String, enum: STATUSES, default: 'active' },
    // When the status last changed — lets analytics stop counting payments
    // after a subscription was paused or cancelled.
    statusChangedAt: { type: Date },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.user;
        return ret;
      },
    },
  },
);

subscriptionSchema.pre('save', function trackStatusChange() {
  if (this.isNew || this.isModified('status')) this.statusChangedAt = new Date();
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;
