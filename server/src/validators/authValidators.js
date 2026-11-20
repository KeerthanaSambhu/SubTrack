import AppError from '../utils/AppError.js';
import { CURRENCIES } from '../utils/constants.js';
import { assertValid, isPlainString } from './helpers.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkName(name) {
  if (!isPlainString(name) || !name.trim()) return 'Enter your name.';
  if (name.trim().length > 60) return 'Keep your name under 60 characters.';
  return null;
}

function checkEmail(email) {
  if (!isPlainString(email) || !email.trim()) return 'Enter your email address.';
  if (email.trim().length > 254 || !EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address.';
  return null;
}

function checkNewPassword(password) {
  if (!isPlainString(password) || !password) return 'Choose a password.';
  if (password.length < 8) return 'Use at least 8 characters.';
  if (password.length > 128) return 'Use 128 characters or fewer.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Include at least one letter and one number.';
  return null;
}

function collect(checks) {
  return Object.fromEntries(Object.entries(checks).filter(([, message]) => message));
}

export function validateRegister(body = {}) {
  assertValid(
    collect({
      name: checkName(body.name),
      email: checkEmail(body.email),
      password: checkNewPassword(body.password),
    }),
  );
  return {
    name: body.name.trim(),
    email: body.email.trim().toLowerCase(),
    password: body.password,
  };
}

export function validateLogin(body = {}) {
  assertValid(
    collect({
      email: checkEmail(body.email),
      password: isPlainString(body.password) && body.password ? null : 'Enter your password.',
    }),
  );
  return { email: body.email.trim().toLowerCase(), password: body.password };
}

/** Profile updates are partial: only fields that are present get validated. */
export function validateProfileUpdate(body = {}) {
  const errors = {};
  const data = {};
  if (body.name !== undefined) {
    const message = checkName(body.name);
    if (message) errors.name = message;
    else data.name = body.name.trim();
  }
  if (body.email !== undefined) {
    const message = checkEmail(body.email);
    if (message) errors.email = message;
    else data.email = body.email.trim().toLowerCase();
  }
  if (body.currency !== undefined) {
    if (!CURRENCIES.includes(body.currency)) errors.currency = 'Choose a supported currency.';
    else data.currency = body.currency;
  }
  assertValid(errors);
  if (Object.keys(data).length === 0) throw new AppError(400, 'Nothing to update.');
  return data;
}

export function validatePasswordChange(body = {}) {
  const errors = collect({
    currentPassword: isPlainString(body.currentPassword) && body.currentPassword ? null : 'Enter your current password.',
    newPassword: checkNewPassword(body.newPassword),
  });
  if (!errors.newPassword && body.newPassword === body.currentPassword) {
    errors.newPassword = 'Choose a password different from your current one.';
  }
  assertValid(errors);
  return { currentPassword: body.currentPassword, newPassword: body.newPassword };
}
