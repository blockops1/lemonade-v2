import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = neon(process.env.POSTGRES_URL!);
    
    // Check if the table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'hourly_winners'
      );
    `;
    
    if (!tableExists[0].exists) {
      return NextResponse.json({ 
        success: false, 
        error: 'hourly_winners table does not exist'
      });
    }
    
    // Get table structure
    const tableStructure = await sql`
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'hourly_winners'
      ORDER BY ordinal_position;
    `;
    
    // Get row count
    const rowCount = await sql`
      SELECT COUNT(*) as count FROM hourly_winners;
    `;
    
    return NextResponse.json({ 
      success: true,
      tableExists: true,
      structure: tableStructure,
      rowCount: rowCount[0].count
    });
  } catch (error) {
    console.error('Table check failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 