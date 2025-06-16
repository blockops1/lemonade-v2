import { sql } from '@vercel/postgres';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Set POSTGRES_URL from DATABASE_URL
process.env.POSTGRES_URL = process.env.DATABASE_URL;

async function checkTables() {
  try {
    console.log('Checking tables and indexes...');
    
    // Check hourly_winners table
    const hourlyWinnersCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'hourly_winners'
      );
    `;
    console.log('hourly_winners table exists:', hourlyWinnersCheck.rows[0].exists);

    // Check player_names table
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
        'idx_hourly_winners_timestamp',
        'idx_hourly_winners_player',
        'idx_player_names_address'
      );
    `;
    console.log('Found indexes:', indexesCheck.rows.map(row => row.indexname));

  } catch (error) {
    console.error('Error checking tables:', error);
    process.exit(1);
  }
}

checkTables(); 