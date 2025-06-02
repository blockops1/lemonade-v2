import React from 'react';
import styles from './GameStatus.module.css';

interface GameStatusProps {
  day: number;
  money: number;
  inventory: {
    lemons: number;
    sugar: number;
    ice: number;
  };
  weather: string;
  lastResult?: {
    sales: number;
    revenue: number;
    weather: string;
    customersServed: number;
    gameOver: boolean;
    won: boolean;
    finalScore: number | null;
    iceUsed: number;
    iceMelted: number;
    advertisingCost: number;
    lemonsUsed: number;
    sugarUsed: number;
  };
}

export const GameStatus: React.FC<GameStatusProps> = ({
  day,
  money,
  inventory,
  weather,
  lastResult
}) => {
  return (
    <div className={styles.status}>
      <div className={styles.mainStats}>
        <div className={styles.stat}>
          <h3>Day</h3>
          <p>{day}/7</p>
        </div>
        <div className={styles.stat}>
          <h3>Money</h3>
          <p>${money.toFixed(2)}</p>
        </div>
        <div className={styles.stat}>
          <h3>Weather</h3>
          <p>{weather}</p>
        </div>
      </div>

      <div className={styles.inventory}>
        <h3>Inventory</h3>
        <div className={styles.inventoryGrid}>
          <div className={styles.inventoryItem}>
            <span>Lemons:</span>
            <span>{inventory.lemons}</span>
          </div>
          <div className={styles.inventoryItem}>
            <span>Sugar:</span>
            <span>{inventory.sugar}</span>
          </div>
          <div className={styles.inventoryItem}>
            <span>Ice:</span>
            <span>{inventory.ice}</span>
          </div>
        </div>
      </div>

      {lastResult?.gameOver && (
        <div className={`${styles.gameOver} ${lastResult.won ? styles.won : styles.lost}`}>
          <h2>Game Complete!</h2>
          <p>Final Money: ${lastResult.finalScore?.toFixed(2)}</p>
          {lastResult.won && (
            <p>You made a profit of ${(money - 20).toFixed(2)}!</p>
          )}
          {!lastResult.won && (
            <p>You lost ${(20 - money).toFixed(2)} of your initial investment.</p>
          )}
        </div>
      )}

      {lastResult && (
        <div className={styles.lastResult}>
          <h3>Last Day's Results</h3>
          <div className={styles.resultGrid}>
            <div className={styles.resultItem}>
              <span>Sales:</span>
              <span>{lastResult.sales} cups</span>
            </div>
            <div className={styles.resultItem}>
              <span>Revenue:</span>
              <span>${lastResult.revenue.toFixed(2)}</span>
            </div>
            <div className={styles.resultItem}>
              <span>Weather:</span>
              <span>{lastResult.weather}</span>
            </div>
            <div className={styles.resultItem}>
              <span>Customers:</span>
              <span>{lastResult.customersServed}</span>
            </div>
            <div className={styles.resultItem}>
              <span>Lemons Used:</span>
              <span>{lastResult.lemonsUsed} lemons</span>
            </div>
            <div className={styles.resultItem}>
              <span>Sugar Used:</span>
              <span>{lastResult.sugarUsed} sugar</span>
            </div>
            <div className={styles.resultItem}>
              <span>Ice Used:</span>
              <span>{lastResult.iceUsed} cubes</span>
            </div>
            <div className={styles.resultItem}>
              <span>Ice Melted:</span>
              <span>{lastResult.iceMelted} cubes</span>
            </div>
            <div className={styles.resultItem}>
              <span>Ad Cost:</span>
              <span>${lastResult.advertisingCost.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 