'use client';

import React, { useEffect, useState } from 'react';
import { useAccount } from '@/context/AccountContext';
import styles from './Leaderboard.module.css';

interface LeaderboardEntry {
  rank: number;
  address: string;
  score: number;
  date: string;
  proof_url: string;
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

// Helper function to format date
const formatDate = (dateString: string) => {
  console.log('Raw date string:', dateString);
  try {
    // Handle SQLite datetime format (YYYY-MM-DD HH:mm:ss)
    const date = new Date(dateString.replace(' ', 'T'));
    console.log('Parsed date:', date);
    if (isNaN(date.getTime())) {
      console.log('Invalid date detected');
      return 'N/A';
    }
    const formatted = date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
    console.log('Formatted date:', formatted);
    return formatted;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedAccount } = useAccount();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }
        const data = await response.json();
        console.log('API response:', data);
        setEntries(data.leaderboard || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading leaderboard...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  const currentPlayerEntry = entries.find(entry => entry.address.toLowerCase() === selectedAccount?.toLowerCase());

  return (
    <div className={styles.container}>
      <h1>Leaderboard</h1>
      
      {currentPlayerEntry && (
        <div className={styles.playerRank}>
          Your Rank: #{currentPlayerEntry.rank} with {formatScore(currentPlayerEntry.score)} points
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.leaderboardTable}>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Score</th>
              <th>Date</th>
              <th>Proof</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.address}
                className={entry.address.toLowerCase() === selectedAccount?.toLowerCase() ? styles.currentPlayer : ''}
              >
                <td>
                  <div className={`${styles.rankBadge} ${entry.rank <= 3 ? styles.top3 : ''}`}>
                    {entry.rank}
                  </div>
                </td>
                <td>{formatAddress(entry.address)}</td>
                <td>{formatScore(entry.score)}</td>
                <td>{formatDate(entry.date)}</td>
                <td>
                  {entry.proof_url ? (
                    <a
                      href={entry.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.verifiedLink}
                    >
                      View Proof
                    </a>
                  ) : (
                    'Pending'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard; 