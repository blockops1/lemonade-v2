import { Metadata } from 'next';
import styles from './DailyWinners.module.css';
import { query } from '@/utils/db';

export const metadata: Metadata = {
  title: 'Top 12 Daily Lemonade Stand Winners',
  description: 'View the top 12 winners from the last 7 days',
};

interface DailyWinner {
  date_timestamp: string;
  player_address: string;
  player_name: string | null;
  score: number;
  rank: number;
}

async function getDailyWinners() {
  try {
    // Get winners from the last 7 days, ensuring no duplicates
    const result = await query<DailyWinner>`
      WITH distinct_winners AS (
        SELECT DISTINCT ON (date_timestamp, player_address)
          date_timestamp,
          player_address,
          player_name,
          score::numeric as score,
          rank
        FROM daily_winners
        WHERE date_timestamp >= NOW() - INTERVAL '7 days'
        ORDER BY date_timestamp DESC, player_address, rank ASC
      )
      SELECT *
      FROM distinct_winners
      ORDER BY date_timestamp DESC, rank ASC
    `;

    // Convert score to number and ensure it's valid
    return result.map(row => ({
      ...row,
      score: Number(row.score) || 0
    }));
  } catch (error) {
    console.error('Error in getDailyWinners:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return [];
  }
}

export default async function DailyWinnersPage() {
  const winners = await getDailyWinners();

  if (winners.length === 0) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Daily Winners</h1>
        <div className={styles.noData}>
          <p>No winners data available yet.</p>
          <p>Check back at noon UTC!</p>
        </div>
      </div>
    );
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
      <h1 className={styles.title}>Daily Winners</h1>
      {Object.entries(winnersByDate).map(([date, dateWinners]) => (
        <div key={date} className={styles.dailySection}>
          <h2 className={styles.dateTitle}>{date}</h2>
          <div className={styles.winnersList}>
            {dateWinners.map((winner, index) => (
              <div 
                key={`${winner.date_timestamp}-${winner.player_address}-${index}`} 
                className={styles.winnerItem}
              >
                <span className={styles.rank}>#{winner.rank}</span>
                <span className={styles.name}>
                  {winner.player_name || 
                    `${winner.player_address.slice(0, 6)}...${winner.player_address.slice(-4)}`}
                </span>
                <span className={styles.score}>
                  ${(winner.score / 10).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 