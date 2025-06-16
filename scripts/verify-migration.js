import { sql } from '@vercel/postgres';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Set POSTGRES_URL from DATABASE_URL
process.env.POSTGRES_URL = process.env.DATABASE_URL;

async function verifyMigration() {
  try {
    console.log('Verifying migration...');
    
    // Check if the table exists and get its structure
    const result = await sql`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'hourly_winners'
      ORDER BY ordinal_position;
    `;

    if (result.rows.length === 0) {
      console.error('Table hourly_winners does not exist!');
      process.exit(1);
    }

    console.log('\nTable Structure:');
    console.log('----------------');
    result.rows.forEach(column => {
      console.log(`${column.column_name}: ${column.data_type} ${column.is_nullable === 'NO' ? 'NOT NULL' : ''} ${column.column_default ? `DEFAULT ${column.column_default}` : ''}`);
    });

    // Check indexes
    const indexes = await sql`
      SELECT 
        indexname, 
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'hourly_winners';
    `;

    console.log('\nIndexes:');
    console.log('--------');
    indexes.rows.forEach(index => {
      console.log(`${index.indexname}: ${index.indexdef}`);
    });

    console.log('\nMigration verification completed successfully!');
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

verifyMigration(); 