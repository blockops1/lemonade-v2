import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Verify POSTGRES_URL is set
if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('Starting migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'daily_winners.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Create database connection
    const sql = neon(process.env.POSTGRES_URL);
    
    // Run the migration
    console.log('Running SQL migration commands...');
    await sql(migrationSQL);
    
    // Verify tables exist
    console.log('Verifying tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('daily_winners', 'player_names')
    `;
    
    console.log('Tables found:', tables.map(t => t.table_name));
    
    // Verify indexes
    console.log('Verifying indexes...');
    const indexes = await sql`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE tablename IN ('daily_winners', 'player_names')
    `;
    
    console.log('Indexes found:', indexes.map(i => `${i.indexname} on ${i.tablename}`));
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 