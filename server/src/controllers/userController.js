import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { signToken } from '../utils/token.js';
import { validatePasswordChange, validateProfileUpdate } from '../validators/authValidators.js';

// PATCH /api/users/me — name, email and/or currency
export async function updateProfile(req, res) {
  const updates = validateProfileUpdate(req.body);

  if (updates.email && updates.email !== req.user.email) {
    if (await User.exists({ email: updates.email, _id: { $ne: req.user._id } })) {
      const message = 'An account with this email already exists.';
      throw new AppError(409, message, { email: message });
    }
  }

  Object.assign(req.user, updates);
  await req.user.save();
  res.json({ user: req.user });
}

// PATCH /api/users/me/password
export async function changePassword(req, res) {
  const { currentPassword, newPassword } = validatePasswordChange(req.body);

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    const message = "That isn't your current password.";
    throw new AppError(400, message, { currentPassword: message });
  }

  user.password = newPassword; // hashed by the model's pre-save hook
  await user.save();

  // Older tokens are now invalid, so hand back a fresh one.
  res.json({ message: 'Password changed.', token: signToken(user._id) });
}
