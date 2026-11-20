// Mirrors the server's rules so users see problems before submitting.
// The server always validates again — never trust the client alone.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  if (!email.trim()) return 'Enter your email address.';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address.';
  return undefined;
}

export function validateNewPassword(password) {
  if (!password) return 'Choose a password.';
  if (password.length < 8) return 'Use at least 8 characters.';
  if (password.length > 128) return 'Use 128 characters or fewer.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Include at least one letter and one number.';
  return undefined;
}

export function validateName(name) {
  if (!name.trim()) return 'Enter your name.';
  if (name.trim().length > 60) return 'Keep your name under 60 characters.';
  return undefined;
}

/** Drops undefined entries so `Object.keys(errors).length` means "has errors". */
export function compactErrors(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v));
}
