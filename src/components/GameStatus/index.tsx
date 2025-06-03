import React, { useState } from 'react';
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
  yesterdayWeather: string;
  lastResult?: {
    sales: number;
    revenue: number;
    weather: string;
    yesterdayWeather: string;
    customersServed: number;
    gameOver: boolean;
    won: boolean;
    finalScore: number | null;
    iceUsed: number;
    iceMelted: number;
    advertisingCost: number;
    lemonsUsed: number;
    sugarUsed: number;
    financialDetails: {
      revenue: number;
      costs: {
        total: number;
        ingredients: {
          total: number;
          lemons: number;
          sugar: number;
          ice: number;
        };
        advertising: number;
      };
      profit: number;
    };
  };
  onReset: () => void;
  onGenerateProof: () => Promise<{
    success: boolean;
    error?: string;
  }>;
}

export const GameStatus: React.FC<GameStatusProps> = ({
  day,
  money,
  inventory,
  weather,
  yesterdayWeather,
  lastResult,
  onReset,
  onGenerateProof
}) => {
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);

  const handleGenerateProof = async () => {
    setIsGeneratingProof(true);
    setProofError(null);
    try {
      const result = await onGenerateProof();
      if (!result.success) {
        setProofError(result.error || 'Failed to generate proof');
      }
    } catch (error) {
      setProofError(error instanceof Error ? error.message : 'Failed to generate proof');
    } finally {
      setIsGeneratingProof(false);
    }
  };

  return (
    <div className={styles.status}>
      <div className={styles.header}>
        <div className={styles.mainStats}>
          <div className={styles.stat}>
            <h3>Day</h3>
            <p>{day}/7</p>
          </div>
          <div className={styles.stat}>
            <h3>Money</h3>
            <p>${(money / 10).toFixed(2)}</p>
          </div>
          <div className={styles.stat}>
            <h3>Today's Weather</h3>
            <p>{weather}</p>
          </div>
          <div className={styles.stat}>
            <h3>Yesterday's Weather</h3>
            <p>{yesterdayWeather}</p>
          </div>
        </div>
        <button 
          onClick={onReset}
          className={styles.resetButton}
        >
          Reset Game
        </button>
      </div>

      {lastResult && !lastResult.gameOver && (
        <div className={styles.lastResult}>
          <h3>Last Day's Results</h3>
          <div className={styles.resultGrid}>
            <div className={styles.resultSection}>
              <h4>Sales Overview</h4>
              <div className={styles.resultItem}>
                <span>Sales:</span>
                <span>{lastResult.sales} cups</span>
              </div>
              <div className={styles.resultItem}>
                <span>Customers:</span>
                <span>{lastResult.customersServed}</span>
              </div>
              <div className={styles.resultItem}>
                <span>Yesterday's Weather:</span>
                <span>{lastResult.yesterdayWeather}</span>
              </div>
              <div className={styles.resultItem}>
                <span>Today's Weather:</span>
                <span>{lastResult.weather}</span>
              </div>
            </div>

            <div className={styles.resultSection}>
              <h4>Financial Summary</h4>
              <div className={styles.resultItem}>
                <span>Revenue:</span>
                <span>${(lastResult.financialDetails.revenue / 10).toFixed(2)}</span>
              </div>
              <div className={styles.resultItem}>
                <span>Total Costs:</span>
                <span>${(lastResult.financialDetails.costs.total / 10).toFixed(2)}</span>
              </div>
              <div className={styles.resultItem}>
                <span>Profit:</span>
                <span>${(lastResult.financialDetails.profit / 10).toFixed(2)}</span>
              </div>
            </div>

            <div className={styles.resultSection}>
              <h4>Ingredient Usage</h4>
              <div className={styles.resultItem}>
                <span>Lemons:</span>
                <span>{lastResult.lemonsUsed} lemons (${(lastResult.financialDetails.costs.ingredients.lemons / 10).toFixed(2)})</span>
              </div>
              <div className={styles.resultItem}>
                <span>Sugar:</span>
                <span>{lastResult.sugarUsed} sugar (${(lastResult.financialDetails.costs.ingredients.sugar / 10).toFixed(2)})</span>
              </div>
              <div className={styles.resultItem}>
                <span>Ice Used:</span>
                <span>{lastResult.iceUsed} cubes (${(lastResult.financialDetails.costs.ingredients.ice / 10).toFixed(2)})</span>
              </div>
              <div className={styles.resultItem}>
                <span>Ice Melted:</span>
                <span>{lastResult.iceMelted} cubes</span>
              </div>
            </div>

            <div className={styles.resultSection}>
              <h4>Marketing</h4>
              <div className={styles.resultItem}>
                <span>Advertising Cost:</span>
                <span>${(lastResult.financialDetails.costs.advertising / 10).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {lastResult && lastResult.gameOver && (
        <div className={styles.gameOver}>
          <h3>Game Over!</h3>
          <p>
            {lastResult.won 
              ? 'Congratulations! You won!' 
              : 'Better luck next time!'}
          </p>
          {lastResult.finalScore !== null && (
            <p>Final Score: ${(lastResult.finalScore / 10).toFixed(2)}</p>
          )}
          <button
            onClick={handleGenerateProof}
            disabled={isGeneratingProof}
            className={styles.proofButton}
          >
            {isGeneratingProof ? 'Generating Proof...' : 'Generate Proof'}
          </button>
          {proofError && (
            <p className={styles.error}>{proofError}</p>
          )}
        </div>
      )}
    </div>
  );
}; 