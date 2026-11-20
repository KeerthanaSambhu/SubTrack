import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { CURRENCIES, DEFAULT_CURRENCY } from '../utils/constants.js';

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    // Never returned by queries unless explicitly requested with .select('+password').
    password: { type: String, required: true, select: false },
    currency: { type: String, enum: CURRENCIES, default: DEFAULT_CURRENCY },
    // Bumped on password change so older tokens stop working.
    passwordChangedAt: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      // Only these fields ever leave the server.
      transform: (doc, ret) => ({
        id: ret._id.toString(),
        name: ret.name,
        email: ret.email,
        currency: ret.currency,
        createdAt: ret.createdAt,
        updatedAt: ret.updatedAt,
      }),
    },
  },
);

// Hash the password whenever it is set or changed.
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  if (!this.isNew) this.passwordChangedAt = new Date();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/** True if the password changed after the token was issued (`iat` is in seconds). */
userSchema.methods.changedPasswordAfter = function changedPasswordAfter(iat) {
  if (!this.passwordChangedAt) return false;
  return Math.floor(this.passwordChangedAt.getTime() / 1000) > iat;
};

const User = mongoose.model('User', userSchema);
export default User;
