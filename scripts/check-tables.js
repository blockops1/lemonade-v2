import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Verify POSTGRES_URL is set
if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

async function checkTables() {
  try {
    console.log('Checking database tables...');
    
    // Create database connection
    const sql = neon(process.env.POSTGRES_URL);
    
    // Check tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('daily_winners', 'player_names')
    `;
    
    console.log('Tables found:', tables.map(t => t.table_name));
    
    // Check indexes
    const indexes = await sql`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE tablename IN ('daily_winners', 'player_names')
    `;
    
    console.log('Indexes found:', indexes.map(i => `${i.indexname} on ${i.tablename}`));
    
  } catch (error) {
    console.error('Error checking tables:', error);
    process.exit(1);
  }
}

checkTables(); 