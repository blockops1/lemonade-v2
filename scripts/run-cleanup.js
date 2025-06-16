import { sql } from '@vercel/postgres';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Set POSTGRES_URL from DATABASE_URL
process.env.POSTGRES_URL = process.env.DATABASE_URL;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runCleanup() {
  try {
    console.log('Starting cleanup...');
    
    // Verify database connection
    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }
    
    // Read the cleanup file
    const cleanupPath = join(__dirname, '../src/app/api/db/migrations/cleanup_hourly_winners.sql');
    const cleanupSQL = readFileSync(cleanupPath, 'utf-8');
    
    console.log('Running cleanup SQL...');
    // Run the cleanup
    await sql.query(cleanupSQL);
    
    console.log('Cleanup completed successfully!');
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

runCleanup(); 