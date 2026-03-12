import { MongoClient, type Collection } from 'mongodb';
import { config } from '../config';
import type { ScanRecord } from '../types';

let client: MongoClient | null = null;

export async function getScansCollection(): Promise<Collection<ScanRecord>> {
  if (!client) {
    client = new MongoClient(config.mongoUrl);
    await client.connect();
  }
  return client.db().collection<ScanRecord>('scans');
}

export async function closeMongoConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}
