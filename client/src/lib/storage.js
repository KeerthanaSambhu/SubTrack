/**
 * SubTrack Local Demo Persistence Layer
 *
 * Provides a database-free, client-side persistence implementation using browser
 * localStorage and Web Crypto API for password hashing.
 *
 * NOTE: This persistence layer is intended for local demonstrations and testing.
 * Authentication and client-side password hashing operate entirely in the browser
 * and are not intended for multi-tenant production security.
 */

import { parseDate, toISODate } from './dates.js';
import { CATEGORIES, BILLING_CYCLES, CURRENCIES, STATUSES } from './constants.js';

const USERS_KEY = 'subtrack_users';
const CURRENT_TOKEN_KEY = 'subtrack_token';
const SUBSCRIPTIONS_PREFIX = 'subtrack_subscriptions_';

// Simulated realistic network latency for believable UI states (spinners, skeletons)
const SIMULATED_DELAY_MS = 60;
const delay = (ms = SIMULATED_DELAY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

function uuid(prefix = '') {
  return `${prefix}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

// -----------------------------------------------------------------------------
// Web Crypto Password Hashing
// -----------------------------------------------------------------------------
async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}:subtrack_local_secret`);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  const bytes = Array.from(new Uint8Array(buffer));
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// -----------------------------------------------------------------------------
// Validation Helpers (Mirrors original server logic)
// -----------------------------------------------------------------------------
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  if (!email || typeof email !== 'string' || !email.trim()) return 'Enter your email address.';
  if (email.trim().length > 254 || !EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address.';
  return null;
}

function validateName(name) {
  if (!name || typeof name !== 'string' || !name.trim()) return 'Enter your name.';
  if (name.trim().length > 60) return 'Keep your name under 60 characters.';
  return null;
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') return 'Choose a password.';
  if (password.length < 8) return 'Use at least 8 characters.';
  if (password.length > 128) return 'Use 128 characters or fewer.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Include at least one letter and one number.';
  return null;
}

class StorageError extends Error {
  constructor(status, message, errors = {}) {
    super(message);
    this.name = 'StorageError';
    this.status = status;
    this.response = {
      status,
      data: { message, errors },
    };
  }
}

// -----------------------------------------------------------------------------
// Storage Readers & Writers
// -----------------------------------------------------------------------------
function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function readSubscriptions(userId) {
  try {
    const raw = localStorage.getItem(`${SUBSCRIPTIONS_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeSubscriptions(userId, subscriptions) {
  localStorage.setItem(`${SUBSCRIPTIONS_PREFIX}${userId}`, JSON.stringify(subscriptions));
}

// -----------------------------------------------------------------------------
// Demo Data Generator
// -----------------------------------------------------------------------------
export const DEMO_USER = {
  email: 'demo@subtrack.app',
  password: 'Password123',
  name: 'Alex Sharma',
  currency: 'INR',
};

function generateDemoSubscriptions(today = new Date()) {
  const d = (days) => {
    const target = new Date(today);
    target.setDate(target.getDate() + days);
    return toISODate(target);
  };
  const m = (months) => {
    const target = new Date(today);
    target.setMonth(target.getMonth() + months);
    return toISODate(target);
  };

  return [
    {
      id: 'sub_demo_1',
      name: 'Netflix Premium',
      amount: 649,
      currency: 'INR',
      category: 'entertainment',
      billingCycle: 'monthly',
      startDate: m(-6),
      nextPaymentDate: d(5),
      status: 'active',
      notes: '4K Ultra HD family plan (shared with parents)',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sub_demo_2',
      name: 'Spotify Premium',
      amount: 119,
      currency: 'INR',
      category: 'music',
      billingCycle: 'monthly',
      startDate: m(-12),
      nextPaymentDate: d(12),
      status: 'active',
      notes: 'Individual plan, ad-free with offline downloads',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 50).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sub_demo_3',
      name: 'GitHub Copilot',
      amount: 10,
      currency: 'USD',
      category: 'productivity',
      billingCycle: 'monthly',
      startDate: m(-8),
      nextPaymentDate: d(2), // Due in 2 days (highlights 'due soon')
      status: 'active',
      notes: 'AI pair programmer for VS Code & JetBrains',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sub_demo_4',
      name: 'Amazon Prime',
      amount: 1499,
      currency: 'INR',
      category: 'entertainment',
      billingCycle: 'yearly',
      startDate: m(-14),
      nextPaymentDate: d(45),
      status: 'active',
      notes: 'Annual subscription includes Prime Delivery & Video',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sub_demo_5',
      name: 'ChatGPT Plus',
      amount: 20,
      currency: 'USD',
      category: 'productivity',
      billingCycle: 'monthly',
      startDate: m(-4),
      nextPaymentDate: d(18),
      status: 'active',
      notes: 'GPT-4o, DALL-E, and Advanced Voice Mode',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sub_demo_6',
      name: 'Google One Cloud',
      amount: 130,
      currency: 'INR',
      category: 'cloud',
      billingCycle: 'monthly',
      startDate: m(-10),
      nextPaymentDate: d(22),
      status: 'active',
      notes: '100 GB cloud storage for Google Photos & Drive',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sub_demo_7',
      name: 'Cult.fit Gym & Fitness',
      amount: 1800,
      currency: 'INR',
      category: 'health',
      billingCycle: 'monthly',
      startDate: m(-5),
      nextPaymentDate: d(30),
      status: 'paused',
      notes: 'Paused temporarily during exam session',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sub_demo_8',
      name: 'Medium Membership',
      amount: 5,
      currency: 'USD',
      category: 'news',
      billingCycle: 'monthly',
      startDate: m(-9),
      nextPaymentDate: d(15),
      status: 'cancelled',
      notes: 'Cancelled last month to cut reading subscriptions',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

/** Ensures demo account and its realistic subscriptions are initialized in storage. */
export async function ensureDemoInitialized() {
  const users = readUsers();
  let demoUser = users.find((u) => u.email.toLowerCase() === DEMO_USER.email.toLowerCase());

  if (!demoUser) {
    const salt = uuid('salt_');
    const passwordHash = await hashPassword(DEMO_USER.password, salt);
    demoUser = {
      id: 'user_demo_101',
      name: DEMO_USER.name,
      email: DEMO_USER.email.toLowerCase(),
      passwordHash,
      salt,
      currency: DEMO_USER.currency,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(demoUser);
    writeUsers(users);
  }

  // Ensure subscriptions exist for demo user
  const subs = readSubscriptions(demoUser.id);
  if (!subs || subs.length === 0) {
    writeSubscriptions(demoUser.id, generateDemoSubscriptions());
  }

  return demoUser;
}

// Auto-seed on initial module import so app is immediately usable
ensureDemoInitialized().catch(() => {});

// -----------------------------------------------------------------------------
// Authentication Service
// -----------------------------------------------------------------------------
function makeToken(userId) {
  const payload = { userId, iat: Date.now() };
  return `local_token_${btoa(JSON.stringify(payload))}`;
}

function parseToken(token) {
  if (!token || typeof token !== 'string' || !token.startsWith('local_token_')) return null;
  try {
    const raw = token.slice('local_token_'.length);
    const parsed = JSON.parse(atob(raw));
    return parsed?.userId ? parsed : null;
  } catch {
    return null;
  }
}

function stripSensitive(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    currency: user.currency || 'INR',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function getCurrentUser(token) {
  const parsed = parseToken(token);
  if (!parsed) return null;
  const users = readUsers();
  return users.find((u) => u.id === parsed.userId) || null;
}

export const localAuthApi = {
  async register({ name, email, password }) {
    await delay();
    const errors = {};
    const nameErr = validateName(name);
    if (nameErr) errors.name = nameErr;
    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;
    const passErr = validatePassword(password);
    if (passErr) errors.password = passErr;

    if (Object.keys(errors).length > 0) {
      throw new StorageError(400, 'Please fix the highlighted fields.', errors);
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = readUsers();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      const msg = 'An account with this email already exists.';
      throw new StorageError(409, msg, { email: msg });
    }

    const salt = uuid('salt_');
    const passwordHash = await hashPassword(password, salt);
    const newUser = {
      id: uuid('user_'),
      name: name.trim(),
      email: cleanEmail,
      currency: 'INR',
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeUsers(users);

    const token = makeToken(newUser.id);
    return { token, user: stripSensitive(newUser) };
  },

  async login({ email, password }) {
    await delay();
    const cleanEmail = (email || '').trim().toLowerCase();
    const users = readUsers();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      throw new StorageError(401, 'That email and password combination is incorrect.');
    }

    const testHash = await hashPassword(password || '', user.salt);
    if (testHash !== user.passwordHash) {
      throw new StorageError(401, 'That email and password combination is incorrect.');
    }

    const token = makeToken(user.id);
    return { token, user: stripSensitive(user) };
  },

  async me() {
    await delay(30);
    const token = localStorage.getItem(CURRENT_TOKEN_KEY);
    const user = getCurrentUser(token);
    if (!user) {
      throw new StorageError(401, 'Your session has expired. Please log in again.');
    }
    return { user: stripSensitive(user) };
  },
};

// -----------------------------------------------------------------------------
// User Profile & Password Service
// -----------------------------------------------------------------------------
export const localUserApi = {
  async updateProfile(updates = {}) {
    await delay();
    const token = localStorage.getItem(CURRENT_TOKEN_KEY);
    const user = getCurrentUser(token);
    if (!user) throw new StorageError(401, 'Please log in to continue.');

    const errors = {};
    if (updates.name !== undefined) {
      const err = validateName(updates.name);
      if (err) errors.name = err;
      else user.name = updates.name.trim();
    }

    if (updates.email !== undefined) {
      const err = validateEmail(updates.email);
      if (err) errors.email = err;
      else {
        const clean = updates.email.trim().toLowerCase();
        const users = readUsers();
        if (users.some((u) => u.id !== user.id && u.email.toLowerCase() === clean)) {
          const msg = 'An account with this email already exists.';
          throw new StorageError(409, msg, { email: msg });
        }
        user.email = clean;
      }
    }

    if (updates.currency !== undefined) {
      if (!CURRENCIES.some((c) => c.value === updates.currency)) {
        errors.currency = 'Choose a supported currency.';
      } else {
        user.currency = updates.currency;
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new StorageError(400, 'Please fix the highlighted fields.', errors);
    }

    user.updatedAt = new Date().toISOString();
    const users = readUsers().map((u) => (u.id === user.id ? user : u));
    writeUsers(users);

    return { user: stripSensitive(user) };
  },

  async changePassword({ currentPassword, newPassword } = {}) {
    await delay();
    const token = localStorage.getItem(CURRENT_TOKEN_KEY);
    const user = getCurrentUser(token);
    if (!user) throw new StorageError(401, 'Please log in to continue.');

    const currentHash = await hashPassword(currentPassword || '', user.salt);
    if (currentHash !== user.passwordHash) {
      const msg = "That isn't your current password.";
      throw new StorageError(400, msg, { currentPassword: msg });
    }

    const passErr = validatePassword(newPassword);
    if (passErr) {
      throw new StorageError(400, passErr, { newPassword: passErr });
    }
    if (newPassword === currentPassword) {
      const msg = 'Choose a password different from your current one.';
      throw new StorageError(400, msg, { newPassword: msg });
    }

    user.passwordHash = await hashPassword(newPassword, user.salt);
    user.updatedAt = new Date().toISOString();
    const users = readUsers().map((u) => (u.id === user.id ? user : u));
    writeUsers(users);

    const freshToken = makeToken(user.id);
    return { message: 'Password changed.', token: freshToken };
  },
};

// -----------------------------------------------------------------------------
// Subscriptions Service (Per-User Storage)
// -----------------------------------------------------------------------------
export const localSubscriptionApi = {
  async list() {
    await delay();
    const token = localStorage.getItem(CURRENT_TOKEN_KEY);
    const user = getCurrentUser(token);
    if (!user) throw new StorageError(401, 'Please log in to continue.');

    const subs = readSubscriptions(user.id);
    // Sort descending by creation date
    subs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { subscriptions: subs };
  },

  async get(id) {
    await delay();
    const token = localStorage.getItem(CURRENT_TOKEN_KEY);
    const user = getCurrentUser(token);
    if (!user) throw new StorageError(401, 'Please log in to continue.');

    const subs = readSubscriptions(user.id);
    const found = subs.find((s) => s.id === id);
    if (!found) throw new StorageError(404, 'Subscription not found.');
    return { subscription: found };
  },

  async create(payload) {
    await delay();
    const token = localStorage.getItem(CURRENT_TOKEN_KEY);
    const user = getCurrentUser(token);
    if (!user) throw new StorageError(401, 'Please log in to continue.');

    const errors = {};
    if (!payload.name || !payload.name.trim()) errors.name = 'Give this subscription a name.';
    else if (payload.name.trim().length > 60) errors.name = 'Keep the name under 60 characters.';

    const amount = Number(payload.amount);
    if (payload.amount === '' || !Number.isFinite(amount) || amount <= 0) {
      errors.amount = 'Enter an amount greater than zero.';
    }

    if (!payload.billingCycle) errors.billingCycle = 'Choose a billing cycle.';
    if (!payload.nextPaymentDate) errors.nextPaymentDate = 'Choose the next payment date.';

    const start = parseDate(payload.startDate);
    const next = parseDate(payload.nextPaymentDate);
    if (start && next && start > next) {
      errors.startDate = 'The start date must be on or before the next payment.';
    }

    if (Object.keys(errors).length > 0) {
      throw new StorageError(400, 'Please fix the highlighted fields.', errors);
    }

    const subs = readSubscriptions(user.id);
    const newSub = {
      id: uuid('sub_'),
      name: payload.name.trim(),
      amount: Math.round(amount * 100) / 100,
      currency: payload.currency || user.currency || 'INR',
      category: payload.category || 'entertainment',
      billingCycle: payload.billingCycle,
      startDate: payload.startDate || toISODate(new Date()),
      nextPaymentDate: payload.nextPaymentDate,
      status: payload.status || 'active',
      notes: (payload.notes || '').trim(),
      statusChangedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    subs.unshift(newSub);
    writeSubscriptions(user.id, subs);

    return { subscription: newSub };
  },

  async update(id, payload) {
    await delay();
    const token = localStorage.getItem(CURRENT_TOKEN_KEY);
    const user = getCurrentUser(token);
    if (!user) throw new StorageError(401, 'Please log in to continue.');

    const subs = readSubscriptions(user.id);
    const index = subs.findIndex((s) => s.id === id);
    if (index === -1) throw new StorageError(404, 'Subscription not found.');

    const current = subs[index];
    const updated = { ...current };

    if (payload.name !== undefined) {
      if (!payload.name.trim()) throw new StorageError(400, 'Give this subscription a name.', { name: 'Give this subscription a name.' });
      updated.name = payload.name.trim();
    }
    if (payload.amount !== undefined) {
      const amt = Number(payload.amount);
      if (!Number.isFinite(amt) || amt <= 0) throw new StorageError(400, 'Enter an amount greater than zero.', { amount: 'Enter an amount greater than zero.' });
      updated.amount = Math.round(amt * 100) / 100;
    }
    if (payload.currency !== undefined) updated.currency = payload.currency;
    if (payload.category !== undefined) updated.category = payload.category;
    if (payload.billingCycle !== undefined) updated.billingCycle = payload.billingCycle;
    if (payload.startDate !== undefined) updated.startDate = payload.startDate;
    if (payload.nextPaymentDate !== undefined) updated.nextPaymentDate = payload.nextPaymentDate;
    if (payload.notes !== undefined) updated.notes = (payload.notes || '').trim();

    if (payload.status !== undefined && payload.status !== current.status) {
      updated.status = payload.status;
      updated.statusChangedAt = new Date().toISOString();
    }

    const start = parseDate(updated.startDate);
    const next = parseDate(updated.nextPaymentDate);
    if (start && next && start > next) {
      throw new StorageError(400, 'The start date must be on or before the next payment.', {
        startDate: 'The start date must be on or before the next payment.',
      });
    }

    updated.updatedAt = new Date().toISOString();
    subs[index] = updated;
    writeSubscriptions(user.id, subs);

    return { subscription: updated };
  },

  async remove(id) {
    await delay();
    const token = localStorage.getItem(CURRENT_TOKEN_KEY);
    const user = getCurrentUser(token);
    if (!user) throw new StorageError(401, 'Please log in to continue.');

    let subs = readSubscriptions(user.id);
    const exists = subs.some((s) => s.id === id);
    if (!exists) throw new StorageError(404, 'Subscription not found.');

    subs = subs.filter((s) => s.id !== id);
    writeSubscriptions(user.id, subs);

    return { message: 'Subscription deleted.', id };
  },

  /** Helper to load sample subscriptions for the current user anytime */
  async resetToSampleSubscriptions() {
    await delay();
    const token = localStorage.getItem(CURRENT_TOKEN_KEY);
    const user = getCurrentUser(token);
    if (!user) throw new StorageError(401, 'Please log in to continue.');

    const sample = generateDemoSubscriptions();
    writeSubscriptions(user.id, sample);
    return { subscriptions: sample };
  },
};
