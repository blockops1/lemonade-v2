import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Verify POSTGRES_URL is set
if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

async function createPlayerNames() {
  try {
    console.log('Creating player_names table...');
    
    // Create database connection
    const sql = neon(process.env.POSTGRES_URL);
    
    // Create the table
    await sql`
      CREATE TABLE IF NOT EXISTS player_names (
        address TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_player_names_address ON player_names(address);
    `;
    
    console.log('player_names table created successfully!');
  } catch (error) {
    console.error('Error creating player_names table:', error);
    process.exit(1);
  }
}

createPlayerNames(); 