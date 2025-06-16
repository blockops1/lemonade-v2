#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';

async function checkDailyWinners() {
  try {
    // Ensure the database URL is properly encoded
    const dbUrl = process.env.POSTGRES_URL;
    if (!dbUrl) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }

    // Parse the URL and encode the password
    const url = new URL(dbUrl);
    const password = url.password;
    url.password = encodeURIComponent(password);
    const encodedUrl = url.toString();
    
    console.log('Connecting to database...');
    const sql = neon(encodedUrl);
    
    console.log('Checking daily_winners table...');
    
    // Check if table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'daily_winners'
      );
    `;
    
    if (!tableCheck[0].exists) {
      console.error('daily_winners table does not exist!');
      return;
    }
    
    // Get row count
    const countResult = await sql`
      SELECT COUNT(*) as count FROM daily_winners;
    `;
    console.log('Total rows:', countResult[0].count);
    
    // Get the most recent entries
    const recentWinners = await sql`
      SELECT 
        date_timestamp,
        player_address,
        player_name,
        score,
        rank
      FROM daily_winners
      ORDER BY date_timestamp DESC, rank ASC
      LIMIT 12;
    `;
    
    console.log('\nMost recent winners:');
    console.log('===================');
    recentWinners.forEach(winner => {
      console.log(`
Date: ${new Date(winner.date_timestamp).toLocaleString()}
Rank: #${winner.rank}
Player: ${winner.player_name || winner.player_address}
Score: $${(winner.score / 10).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}
-------------------`);
    });
    
  } catch (error) {
    console.error('Error checking daily winners:', error);
    if (error.cause) {
      console.error('Caused by:', error.cause);
    }
  }
}

checkDailyWinners(); 