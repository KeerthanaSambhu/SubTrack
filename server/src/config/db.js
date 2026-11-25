import mongoose from 'mongoose';

/*
 * One shared MongoDB connection, reused for as long as the process lives.
 *
 * Locally, server.js connects once at startup. On Vercel the app runs as a
 * serverless function: the first request connects, and later requests that
 * reach the same (warm) instance reuse the open connection instead of opening
 * a new one each time. Concurrent first requests share one in-flight attempt.
 *
 * A failure is thrown (not process.exit) so a serverless instance can answer
 * with an error and retry on the next request instead of crashing.
 */
let connecting = null; // the in-flight connection attempt, if any
let listenersAttached = false;

function attachListeners() {
  if (listenersAttached) return;
  listenersAttached = true;
  mongoose.connection.on('disconnected', () => console.warn('⚠ MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => console.log('✔ MongoDB reconnected'));
}

export async function connectDatabase(uri) {
  if (mongoose.connection.readyState === 1) return mongoose.connection; // already connected: reuse

  if (!connecting) {
    mongoose.set('strictQuery', true);
    attachListeners();
    connecting = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10000,
        // A small pool is plenty for one instance and keeps Atlas connection
        // counts low when several serverless instances run at once.
        maxPoolSize: 10,
      })
      .then(() => {
        console.log(`✔ Connected to MongoDB (${mongoose.connection.name})`);
        return mongoose.connection;
      })
      .catch((error) => {
        connecting = null; // allow the next call to try again
        console.error('\n✖ Could not connect to MongoDB.');
        console.error(`  ${error.message}`);
        console.error('  Check MONGODB_URI and, for Atlas, that this host is allowed under Network Access.\n');
        throw error;
      });
  }
  return connecting;
}

export async function disconnectDatabase() {
  connecting = null;
  await mongoose.connection.close();
}
