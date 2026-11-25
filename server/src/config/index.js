import 'dotenv/config';

/*
 * All configuration comes from environment variables (see .env.example).
 * The server refuses to start if a required secret is missing, rather than
 * silently falling back to an insecure default.
 */
function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    console.error(`\n✖ Missing required environment variable: ${name}`);
    console.error('  Copy server/.env.example to server/.env and fill it in.\n');
    process.exit(1);
  }
  return value.trim();
}

const nodeEnv = process.env.NODE_ENV || 'development';

const isTest = nodeEnv === 'test';

const config = {
  env: nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest,
  // bcrypt cost factor: each +1 doubles the time to hash (and to brute-force).
  // Only the test suite may lower it (BCRYPT_ROUNDS), purely to keep tests fast.
  bcryptRounds: isTest && Number(process.env.BCRYPT_ROUNDS) >= 4 ? Number(process.env.BCRYPT_ROUNDS) : 12,
  port: Number(process.env.PORT) || 5000,
  mongoUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Comma-separated list of allowed frontend origins.
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

if (config.jwtSecret.length < 32) {
  console.error('\n✖ JWT_SECRET must be at least 32 characters long.');
  console.error('  Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"\n');
  process.exit(1);
}

export default config;
