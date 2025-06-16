#!/usr/bin/env node

import { sql } from '@vercel/postgres';
import { config } from 'dotenv';
import { resolve } from 'path';
import fetch from 'node-fetch';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Set POSTGRES_URL from DATABASE_URL
process.env.POSTGRES_URL = process.env.DATABASE_URL;

async function testDailyWinners() {
  try {
    console.log('Testing daily winners update...');
    
    // Call the update endpoint
    const response = await fetch('http://localhost:3000/api/daily-winners', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    });

    console.log('Update endpoint response:', {
      status: response.status,
      statusText: response.statusText
    });

    const data = await response.json();
    console.log('Response data:', data);

    if (response.ok) {
      // Verify the data was inserted
      console.log('\nVerifying inserted data...');
      
      const winners = await sql`
        SELECT 
          date_timestamp,
          player_address,
          player_name,
          score,
          rank
        FROM daily_winners
        WHERE date_timestamp >= NOW() - INTERVAL '1 day'
        ORDER BY date_timestamp DESC, rank ASC
      `;

      console.log('\nFound winners:', winners.rows.length);
      winners.rows.forEach(winner => {
        console.log({
          date: new Date(winner.date_timestamp).toISOString(),
          rank: winner.rank,
          player: winner.player_name || winner.player_address,
          score: winner.score
        });
      });
    }

  } catch (error) {
    console.error('Error testing daily winners:', error);
    process.exit(1);
  }
}

testDailyWinners(); 