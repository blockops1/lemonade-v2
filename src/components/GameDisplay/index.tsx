import React from 'react';
import styles from './GameDisplay.module.css';

interface GameDisplayProps {
  money: number;
  inventory: {
    lemons: number;
    sugar: number;
    ice: number;
  };
  lastResult?: {
    customers: number;
    revenue: number;
    expenses: number;
    adCost: number;
    profit: number;
    weather: string;
  };
}

export const GameDisplay: React.FC<GameDisplayProps> = ({
  money,
  inventory,
  lastResult
}) => {
  // Convert units to dollars for display
  const formatMoney = (units: number) => `$${(units / 10).toFixed(2)}`;

  return (
    <div className={styles.display}>
      <div className={styles.status}>
        <h2>Current Status</h2>
        <p>Money: {formatMoney(money)}</p>
        <h3>Inventory</h3>
        <ul>
          <li>Lemons: {inventory.lemons}</li>
          <li>Sugar: {inventory.sugar}</li>
          <li>Ice: {inventory.ice}</li>
        </ul>
      </div>

      {lastResult && (
        <div className={styles.results}>
          <h2>Last Day's Results</h2>
          <p>Weather: {lastResult.weather}</p>
          <p>Customers Served: {lastResult.customers}</p>
          <p>Revenue: {formatMoney(lastResult.revenue)}</p>
          <p>Ingredient Expenses: {formatMoney(lastResult.expenses)}</p>
          <p>Advertising Cost: {formatMoney(lastResult.adCost)}</p>
          <p>Total Profit: {formatMoney(lastResult.profit)}</p>
        </div>
      )}
    </div>
  );
}; 