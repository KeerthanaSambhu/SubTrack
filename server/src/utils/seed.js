import config from '../config/index.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';

const DEMO_EMAIL = 'demo@subtrack.app';
const DEMO_PASSWORD = 'Password123';
const DEMO_NAME = 'Alex Sharma';

function toMidnightUTC(date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

function addDays(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return toMidnightUTC(d);
}

function addMonths(base, months) {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return toMidnightUTC(d);
}

async function seed() {
  console.log('Connecting to database...');
  await connectDatabase(config.mongoUri);

  try {
    // 1. Find or create demo user
    let user = await User.findOne({ email: DEMO_EMAIL });
    if (user) {
      console.log(`Resetting existing demo user: ${DEMO_EMAIL}`);
      await Subscription.deleteMany({ user: user._id });
    } else {
      console.log(`Creating demo user: ${DEMO_EMAIL}`);
      user = await User.create({
        name: DEMO_NAME,
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        currency: 'INR',
      });
    }

    const today = new Date();

    // 2. Realistic demo subscriptions
    const sampleSubscriptions = [
      {
        user: user._id,
        name: 'Netflix Premium',
        amount: 649,
        currency: 'INR',
        category: 'entertainment',
        billingCycle: 'monthly',
        startDate: addMonths(today, -6),
        nextPaymentDate: addDays(today, 5),
        status: 'active',
        notes: '4K Ultra HD family plan (shared with parents)',
      },
      {
        user: user._id,
        name: 'Spotify Premium',
        amount: 119,
        currency: 'INR',
        category: 'music',
        billingCycle: 'monthly',
        startDate: addMonths(today, -12),
        nextPaymentDate: addDays(today, 12),
        status: 'active',
        notes: 'Individual plan, ad-free with offline downloads',
      },
      {
        user: user._id,
        name: 'GitHub Copilot',
        amount: 10,
        currency: 'USD',
        category: 'productivity',
        billingCycle: 'monthly',
        startDate: addMonths(today, -8),
        nextPaymentDate: addDays(today, 2), // Due soon (< 3 days)
        status: 'active',
        notes: 'AI pair programmer for VS Code & JetBrains',
      },
      {
        user: user._id,
        name: 'Amazon Prime',
        amount: 1499,
        currency: 'INR',
        category: 'entertainment',
        billingCycle: 'yearly',
        startDate: addMonths(today, -14),
        nextPaymentDate: addDays(today, 45),
        status: 'active',
        notes: 'Annual subscription includes Prime Delivery & Video',
      },
      {
        user: user._id,
        name: 'ChatGPT Plus',
        amount: 20,
        currency: 'USD',
        category: 'productivity',
        billingCycle: 'monthly',
        startDate: addMonths(today, -4),
        nextPaymentDate: addDays(today, 18),
        status: 'active',
        notes: 'GPT-4o, DALL-E, and Advanced Voice Mode',
      },
      {
        user: user._id,
        name: 'Google One Cloud',
        amount: 130,
        currency: 'INR',
        category: 'cloud',
        billingCycle: 'monthly',
        startDate: addMonths(today, -10),
        nextPaymentDate: addDays(today, 22),
        status: 'active',
        notes: '100 GB cloud storage for Google Photos & Drive',
      },
      {
        user: user._id,
        name: 'Cult.fit Gym & Fitness',
        amount: 1800,
        currency: 'INR',
        category: 'health',
        billingCycle: 'monthly',
        startDate: addMonths(today, -5),
        nextPaymentDate: addDays(today, 30),
        status: 'paused',
        notes: 'Paused temporarily during exam session',
      },
      {
        user: user._id,
        name: 'Medium Membership',
        amount: 5,
        currency: 'USD',
        category: 'news',
        billingCycle: 'monthly',
        startDate: addMonths(today, -9),
        nextPaymentDate: addDays(today, 15),
        status: 'cancelled',
        notes: 'Cancelled last month to cut reading subscriptions',
      },
    ];

    const inserted = await Subscription.insertMany(sampleSubscriptions);
    console.log(`\n✔ Successfully seeded ${inserted.length} subscriptions!`);
    console.log('\nDemo Account Credentials:');
    console.log(`  Email:    ${DEMO_EMAIL}`);
    console.log(`  Password: ${DEMO_PASSWORD}`);
    console.log('  Currency: INR (with sample USD plans to showcase multi-currency)\n');
  } catch (error) {
    console.error('✖ Error seeding database:', error);
    process.exitCode = 1; // report failure to the terminal / CI
  } finally {
    // Always close the connection so Node can exit. We set process.exitCode
    // rather than calling process.exit(), so a failure recorded above is
    // never overwritten with "success".
    try {
      await disconnectDatabase();
    } catch (error) {
      console.error('✖ Could not close the database connection:', error.message);
      process.exitCode = 1;
    }
  }
}

seed();
