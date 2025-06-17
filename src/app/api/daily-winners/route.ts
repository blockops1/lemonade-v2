import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { z } from 'zod';

// Schema for validating daily winner data
const DailyWinnerSchema = z.object({
  player_address: z.string(),
  player_name: z.string(),
  score: z.number(),
  rank: z.number(),
});

// Use environment variable
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  throw new Error('CRON_SECRET environment variable is not set');
}

// Debug: Log the secret at module load time
console.log('Module loaded with CRON_SECRET:', CRON_SECRET ? 'Set' : 'Not set');

export async function GET(request: Request) {
  try {
    // Check if this is a cron job request by looking for CRON_SECRET in query params
    const { searchParams } = new URL(request.url);
    const cronSecret = searchParams.get('cron_secret');
    
    // If CRON_SECRET is provided and matches, perform the daily update
    if (cronSecret && cronSecret === CRON_SECRET) {
      console.log('Received cron job request via GET method');
      
      const sql = neon(process.env.DATABASE_URL!);

      // Get current date at noon UTC
      const currentDate = new Date();
      currentDate.setUTCHours(12, 0, 0, 0);
      console.log('Current date (noon UTC):', currentDate.toISOString());

      // First check if we have any data in the leaderboard
      const leaderboardCheck = await sql`
        SELECT COUNT(*) as count FROM leaderboard
      `;
      console.log('Leaderboard entries:', leaderboardCheck[0].count);

      if (parseInt(leaderboardCheck[0].count) === 0) {
        console.log('No entries in leaderboard');
        return NextResponse.json(
          { error: 'No leaderboard entries found' },
          { status: 400 }
        );
      }

      // Get top 10 players from the main leaderboard
      console.log('Fetching top 10 players from leaderboard...');
      const topPlayers = await sql`
        SELECT 
          address as player_address,
          COALESCE(
            (SELECT name FROM player_names WHERE address = leaderboard.address),
            address
          ) as player_name,
          score,
          ROW_NUMBER() OVER (ORDER BY score DESC) as rank
        FROM leaderboard
        ORDER BY score DESC
        LIMIT 10
      `;

      console.log('Top players found:', {
        count: topPlayers.length,
        players: topPlayers
      });

      if (topPlayers.length === 0) {
        console.log('No top players found');
        return NextResponse.json(
          { error: 'No top players found' },
          { status: 400 }
        );
      }

      // Insert the top 10 players into daily_winners
      console.log('Inserting winners into daily_winners table...');
      for (const player of topPlayers) {
        try {
          await sql`
            INSERT INTO daily_winners (
              date_timestamp,
              player_address,
              player_name,
              score,
              rank
            ) VALUES (
              ${currentDate.toISOString()},
              ${player.player_address},
              ${player.player_name},
              ${player.score},
              ${player.rank}
            )
          `;
        } catch (insertError) {
          console.error('Error inserting player:', {
            player,
            error: insertError
          });
          throw insertError;
        }
      }

      // Delete entries older than 7 days
      console.log('Cleaning up old entries...');
      await sql`
        DELETE FROM daily_winners
        WHERE date_timestamp < NOW() - INTERVAL '7 days'
      `;

      // Reset the leaderboard
      console.log('Resetting leaderboard...');
      await sql`
        TRUNCATE TABLE leaderboard
      `;

      console.log('Daily winners update and leaderboard reset completed successfully');
      return NextResponse.json({ 
        success: true, 
        message: 'Daily winners updated and leaderboard reset',
        winnersCount: topPlayers.length,
        timestamp: currentDate.toISOString()
      });
    }

    // Regular GET request - fetch daily winners
    console.log('Fetching daily winners...');
    
    const sql = neon(process.env.DATABASE_URL!);
    
    // First, verify the table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'daily_winners'
      );
    `;
    
    console.log('Table exists:', tableCheck[0].exists);
    
    if (!tableCheck[0].exists) {
      console.error('daily_winners table does not exist!');
      return NextResponse.json(
        { error: 'Database table not found' },
        { status: 500 }
      );
    }
    
    // Get the last 7 days of winners
    const result = await sql`
      WITH ranked_winners AS (
        SELECT 
          date_timestamp,
          player_address,
          player_name,
          score,
          rank,
          ROW_NUMBER() OVER (
            PARTITION BY date_timestamp, player_address 
            ORDER BY rank ASC
          ) as rn
        FROM daily_winners
        WHERE date_timestamp >= NOW() - INTERVAL '7 days'
      )
      SELECT 
        date_timestamp,
        player_address,
        player_name,
        score,
        rank
      FROM ranked_winners
      WHERE rn = 1
      ORDER BY date_timestamp DESC, rank ASC
    `;

    console.log('Query result:', {
      count: result.length,
      rows: result
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET method:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// This endpoint will be called by the cron job
export async function POST(request: Request) {
  try {
    console.log('Received daily winners update request');
    
    // Verify the request is from our cron job
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    console.log('CRON_SECRET:', CRON_SECRET ? 'Set' : 'Not set');
    
    // Debug: Log the exact values being compared
    console.log('Auth header value:', authHeader);
    console.log('Expected header:', `Bearer ${CRON_SECRET}`);
    console.log('Environment CRON_SECRET:', process.env.CRON_SECRET);
    
    // Debug: Log the exact comparison
    const expectedHeader = `Bearer ${CRON_SECRET}`;
    console.log('Authorization check:', {
      received: authHeader,
      expected: expectedHeader,
      match: authHeader === expectedHeader,
      receivedLength: authHeader?.length,
      expectedLength: expectedHeader.length,
      receivedChars: authHeader?.split('').map(c => c.charCodeAt(0)),
      expectedChars: expectedHeader.split('').map(c => c.charCodeAt(0))
    });
    
    if (authHeader !== expectedHeader) {
      console.log('Unauthorized request - invalid or missing CRON_SECRET');
      console.log('Comparison failed:', {
        received: authHeader,
        expected: expectedHeader,
        receivedLength: authHeader?.length,
        expectedLength: expectedHeader.length
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sql = neon(process.env.POSTGRES_URL!);

    // Get current date at noon UTC
    const currentDate = new Date();
    currentDate.setUTCHours(12, 0, 0, 0);
    console.log('Current date (noon UTC):', currentDate.toISOString());

    // First check if we have any data in the leaderboard
    const leaderboardCheck = await sql`
      SELECT COUNT(*) as count FROM leaderboard
    `;
    console.log('Leaderboard entries:', leaderboardCheck[0].count);

    if (parseInt(leaderboardCheck[0].count) === 0) {
      console.log('No entries in leaderboard');
      return NextResponse.json(
        { error: 'No leaderboard entries found' },
        { status: 400 }
      );
    }

    // Get top 10 players from the main leaderboard
    console.log('Fetching top 10 players from leaderboard...');
    const topPlayers = await sql`
      SELECT 
        address as player_address,
        COALESCE(
          (SELECT name FROM player_names WHERE address = leaderboard.address),
          address
        ) as player_name,
        score,
        ROW_NUMBER() OVER (ORDER BY score DESC) as rank
      FROM leaderboard
      ORDER BY score DESC
      LIMIT 10
    `;

    console.log('Top players found:', {
      count: topPlayers.length,
      players: topPlayers
    });

    if (topPlayers.length === 0) {
      console.log('No top players found');
      return NextResponse.json(
        { error: 'No top players found' },
        { status: 400 }
      );
    }

    // Insert the top 10 players into daily_winners
    console.log('Inserting winners into daily_winners table...');
    for (const player of topPlayers) {
      try {
        await sql`
          INSERT INTO daily_winners (
            date_timestamp,
            player_address,
            player_name,
            score,
            rank
          ) VALUES (
            ${currentDate.toISOString()},
            ${player.player_address},
            ${player.player_name},
            ${player.score},
            ${player.rank}
          )
        `;
      } catch (insertError) {
        console.error('Error inserting player:', {
          player,
          error: insertError
        });
        throw insertError;
      }
    }

    // Delete entries older than 7 days
    console.log('Cleaning up old entries...');
    await sql`
      DELETE FROM daily_winners
      WHERE date_timestamp < NOW() - INTERVAL '7 days'
    `;

    // Reset the leaderboard
    console.log('Resetting leaderboard...');
    await sql`
      TRUNCATE TABLE leaderboard
    `;

    console.log('Daily winners update and leaderboard reset completed successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating daily winners:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: 'Failed to update daily winners' },
      { status: 500 }
    );
  }
} 