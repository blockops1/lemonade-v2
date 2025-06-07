import Database from 'better-sqlite3';
import path from 'path';

// Check if we're in a server environment
const isServer = typeof window === 'undefined';

// Only initialize database on server
let db: Database.Database | null = null;

if (isServer) {
  const dbPath = path.join(process.cwd(), 'data', 'leaderboard.db');
  db = new Database(dbPath);
  
  // Create table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT NOT NULL,
      score INTEGER NOT NULL,
      proof_url TEXT NOT NULL,
      date DATETIME DEFAULT (datetime('now', 'localtime'))
    )
  `);
}

export interface LeaderboardEntry {
  id: number;
  address: string;
  score: number;
  proof_url: string;
  date: string;
  rank: number;
}

export function getLeaderboard(): LeaderboardEntry[] {
  if (!isServer || !db) {
    throw new Error('Database operations can only be performed on the server');
  }

  const stmt = db.prepare(`
    WITH RankedEntries AS (
      SELECT 
        *,
        ROW_NUMBER() OVER (ORDER BY score DESC) as rank
      FROM leaderboard
    )
    SELECT * FROM RankedEntries
    ORDER BY score DESC 
    LIMIT 100
  `);
  
  return stmt.all() as LeaderboardEntry[];
}

export function addLeaderboardEntry(address: string, score: number, proof_url: string): LeaderboardEntry {
  if (!isServer || !db) {
    throw new Error('Database operations can only be performed on the server');
  }

  const stmt = db.prepare(`
    INSERT INTO leaderboard (address, score, proof_url)
    VALUES (?, ?, ?)
    RETURNING *
  `);
  
  const entry = stmt.get(address, score, proof_url) as LeaderboardEntry;
  const rank = getPlayerRank(address);
  return { ...entry, rank };
}

export function getPlayerRank(address: string): number {
  if (!isServer || !db) {
    throw new Error('Database operations can only be performed on the server');
  }

  const stmt = db.prepare(`
    SELECT COUNT(*) + 1 as rank
    FROM leaderboard
    WHERE score > (
      SELECT score
      FROM leaderboard
      WHERE address = ?
      ORDER BY score DESC
      LIMIT 1
    )
  `);
  
  const result = stmt.get(address) as { rank: number };
  return result.rank;
} 