import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Verify POSTGRES_URL is set
if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

async function runCleanup() {
  try {
    console.log('Starting cleanup...');
    
    // Create database connection
    const sql = neon(process.env.POSTGRES_URL);
    
    // Drop the tables and indexes
    console.log('Running cleanup SQL commands...');
    await sql`
      DROP TABLE IF EXISTS daily_winners CASCADE;
      DROP TABLE IF EXISTS player_names CASCADE;
    `;
    
    console.log('Cleanup completed successfully!');
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

runCleanup(); 