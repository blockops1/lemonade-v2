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

async function runMigration() {
  try {
    console.log('Starting migration...');
    
    // Verify database connection
    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }
    
    // Read the migration file
    const migrationPath = join(__dirname, '../src/app/api/db/migrations/daily_winners.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('Running SQL migration...');
    // Run the migration
    await sql.query(migrationSQL);
    
    // Verify the tables were created
    console.log('Verifying tables...');
    
    const dailyWinnersCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'daily_winners'
      );
    `;
    console.log('daily_winners table exists:', dailyWinnersCheck.rows[0].exists);

    const playerNamesCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'player_names'
      );
    `;
    console.log('player_names table exists:', playerNamesCheck.rows[0].exists);

    // Check indexes
    const indexesCheck = await sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE indexname IN (
        'idx_daily_winners_timestamp',
        'idx_daily_winners_player',
        'idx_player_names_address'
      );
    `;
    console.log('Found indexes:', indexesCheck.rows.map(row => row.indexname));
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 