import { neon } from '@neondatabase/serverless';
import { z } from 'zod';

// Validate database URL format
const DatabaseUrlSchema = z.string().url().refine(
  (url) => url.startsWith('postgres://') || url.startsWith('postgresql://'),
  'Database URL must be a valid PostgreSQL connection string'
);

// Database configuration
const config = {
  connectionString: process.env.POSTGRES_URL as string,
};

// Validate configuration
if (!config.connectionString) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

try {
  DatabaseUrlSchema.parse(config.connectionString);
} catch (error) {
  throw new Error('Invalid database connection string format');
}

// Create a singleton database connection
let db: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!db) {
    // Parse the URL and encode the password
    const url = new URL(config.connectionString);
    const password = url.password;
    url.password = encodeURIComponent(password);
    const encodedUrl = url.toString();

    db = neon(encodedUrl);
  }
  return db;
}

// Export a type-safe query function
export async function query<T extends Record<string, any>>(sql: TemplateStringsArray, ...params: any[]): Promise<T[]> {
  const db = getDb();
  return db(sql, ...params) as Promise<T[]>;
} 