import { neon } from '@neondatabase/serverless';

// Get the database URL from environment variables
const sql = neon(process.env.DATABASE_URL!);

export interface LeaderboardEntry {
  id: number;
  address: string;
  score: number;
  proof_url: string;
  date: string;
  rank: number;
}

// Initialize the database table
export async function initializeDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS leaderboard (
        id SERIAL PRIMARY KEY,
        address TEXT NOT NULL,
        score INTEGER NOT NULL,
        proof_url TEXT NOT NULL,
        date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const result = await sql`
      WITH RankedEntries AS (
        SELECT 
          *,
          ROW_NUMBER() OVER (ORDER BY score DESC) as rank
        FROM leaderboard
      )
      SELECT * FROM RankedEntries
      ORDER BY score DESC 
      LIMIT 100
    `;
    
    return result as LeaderboardEntry[];
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
}

export async function addLeaderboardEntry(
  address: string, 
  score: number, 
  proof_url: string
): Promise<LeaderboardEntry> {
  try {
    const result = await sql`
      INSERT INTO leaderboard (address, score, proof_url)
      VALUES (${address}, ${score}, ${proof_url})
      RETURNING *
    `;
    
    const entry = result[0] as LeaderboardEntry;
    const rank = await getPlayerRank(address);
    return { ...entry, rank };
  } catch (error) {
    console.error('Error adding leaderboard entry:', error);
    throw error;
  }
}

export async function getPlayerRank(address: string): Promise<number> {
  try {
    const result = await sql`
      SELECT COUNT(*) + 1 as rank
      FROM leaderboard
      WHERE score > (
        SELECT score
        FROM leaderboard
        WHERE address = ${address}
        ORDER BY score DESC
        LIMIT 1
      )
    `;
    
    return parseInt(result[0].rank);
  } catch (error) {
    console.error('Error getting player rank:', error);
    throw error;
  }
} 