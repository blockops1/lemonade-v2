import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = neon(process.env.POSTGRES_URL!);
    
    // Test the connection with a simple query
    const result = await sql`SELECT NOW() as current_time`;
    
    return NextResponse.json({ 
      success: true, 
      time: result[0].current_time,
      env: {
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        postgresUrlLength: process.env.POSTGRES_URL?.length,
        databaseUrlLength: process.env.DATABASE_URL?.length
      }
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      env: {
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        postgresUrlLength: process.env.POSTGRES_URL?.length,
        databaseUrlLength: process.env.DATABASE_URL?.length
      }
    }, { status: 500 });
  }
} 