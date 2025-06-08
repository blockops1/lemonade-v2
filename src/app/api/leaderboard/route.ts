import { NextResponse } from 'next/server';
import { getLeaderboard, addLeaderboardEntry, getPlayerRank, initializeDatabase } from '@/utils/database';

// Initialize database on startup
initializeDatabase().catch(console.error);

export async function GET() {
  try {
    const leaderboard = await getLeaderboard();
    console.log('Leaderboard data from database:', leaderboard);
    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { address, score, proof_url } = await request.json();

    if (!address || typeof score !== 'number' || !proof_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const entry = await addLeaderboardEntry(address, score, proof_url);
    console.log('New leaderboard entry:', entry);
    const playerRank = await getPlayerRank(address);

    return NextResponse.json({ entry, playerRank });
  } catch (error) {
    console.error('Error adding leaderboard entry:', error);
    return NextResponse.json(
      { error: 'Failed to add leaderboard entry' },
      { status: 500 }
    );
  }
} 