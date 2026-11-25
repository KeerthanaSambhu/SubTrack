import config from './config/index.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { createApp } from './app.js';

// Local / long-running server: connect once at startup and stop with a clear
// message if the database is unreachable. (On Vercel, src/app.js is used
// instead and connects on the first request.)
try {
  await connectDatabase(config.mongoUri);
} catch {
  process.exit(1); // connectDatabase has already printed what went wrong
}

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`✔ SubTrack API running at http://localhost:${config.port} (${config.env})`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n✖ Port ${config.port} is already in use. Stop the other process or set PORT in server/.env.\n`);
  } else {
    console.error(error);
  }
  process.exit(1);
});

// Close connections cleanly on Ctrl+C or when the host stops the process.
async function shutdown(signal) {
  console.log(`\n${signal} received — shutting down…`);
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
