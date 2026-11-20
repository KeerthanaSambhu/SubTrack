import mongoose from 'mongoose';

export async function connectDatabase(uri) {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`✔ Connected to MongoDB (${mongoose.connection.name})`);
  } catch (error) {
    console.error('\n✖ Could not connect to MongoDB.');
    console.error(`  ${error.message}`);
    console.error('  Check MONGODB_URI in server/.env and, for Atlas, that your IP address is allowed under Network Access.\n');
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => console.warn('⚠ MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => console.log('✔ MongoDB reconnected'));
}

export async function disconnectDatabase() {
  await mongoose.connection.close();
}
