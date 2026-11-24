/*
 * Runs once for the whole test run: starts ONE in-memory MongoDB and shares
 * its address with every test file. (One server is faster and more reliable
 * than starting a separate one per file.)
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function startMongo({ provide }) {
  const mongo = await MongoMemoryServer.create();
  provide('mongoUri', mongo.getUri());
  return async () => {
    await mongo.stop();
  };
}
