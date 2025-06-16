'use client';

import { useEffect, useState } from 'react';
import styles from './DailyWinners.module.css';
import Link from 'next/link';

interface DailyWinner {
  date_timestamp: string;
  player_address: string;
  player_name: string;
  score: number;
  rank: number;
}

// Helper function to format address
const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Helper function to format score
const formatScore = (score: number) => {
  // Convert from 10-cent units to dollars
  const dollars = (score * 0.1).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `$${dollars}`;
};

export default function DailyWinners() {
  const [winners, setWinners] = useState<DailyWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const response = await fetch('/api/daily-winners');
        if (!response.ok) {
          throw new Error('Failed to fetch daily winners');
        }
        const data = await response.json();
        setWinners(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchWinners();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading daily winners...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  // Group winners by date
  const winnersByDate = winners.reduce((acc, winner) => {
    const date = new Date(winner.date_timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(winner);
    return acc;
  }, {} as Record<string, DailyWinner[]>);

  return (
    <div className={styles.container}>
      <h1>Lemonade Stand Daily Winners</h1>
      
      <div className={styles.navigation}>
        <Link href="/" className={styles.homeLink}>
          ← Back to Game
        </Link>
      </div>

      <div className={styles.tableContainer}>
        {Object.entries(winnersByDate).map(([date, dateWinners]) => (
          <div key={date} className={styles.dailySection}>
            <h2>{date}</h2>
            <table className={styles.winnersTable}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dateWinners.map((winner) => (
                  <tr key={`${winner.date_timestamp}-${winner.player_address}`}>
                    <td>
                      <div className={`${styles.rankBadge} ${winner.rank <= 3 ? styles.top3 : ''}`}>
                        {winner.rank}
                      </div>
                    </td>
                    <td>{winner.player_name || formatAddress(winner.player_address)}</td>
                    <td>{formatScore(winner.score)}</td>
                    <td>
                      <span className={styles.verifiedLink}>Verified</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {Object.keys(winnersByDate).length === 0 && (
          <div className={styles.loading}>
            <p>No daily winners yet</p>
            <p>Check back after the first daily update!</p>
          </div>
        )}
      </div>
    </div>
  );
} 