import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import config from '../config/index.js';
import { CURRENCIES, DEFAULT_CURRENCY } from '../utils/constants.js';

/*
 * User — one document per account.
 * A user "owns" many Subscription documents (see Subscription.user).
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true, // creates a unique index: two accounts can't share an email
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    // A bcrypt hash, never the real password. `select: false` means queries
    // leave it out unless code explicitly asks with .select('+password').
    password: { type: String, required: true, select: false },
    currency: { type: String, enum: CURRENCIES, default: DEFAULT_CURRENCY },
    // When the password was last changed (informational; tokenVersion does the invalidating).
    passwordChangedAt: { type: Date, select: false },
    // Every login token records the version that was current when it was issued.
    // Bumping this number (on password change) instantly invalidates all older tokens.
    tokenVersion: { type: Number, default: 0, select: false },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    toJSON: {
      // Whitelist: only these fields ever leave the server.
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

// Hash the password whenever it is set or changed (registration, password change).
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, config.bcryptRounds);
  if (!this.isNew) {
    this.passwordChangedAt = new Date();
    this.tokenVersion = (this.tokenVersion || 0) + 1;
  }
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
