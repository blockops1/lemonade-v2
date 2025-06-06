import React, { useState } from 'react';
import styles from './GameStatus.module.css';
import { useGameProof } from '../../hooks/useGameProof';
import { useProofUrl } from '@/hooks/useProofUrl';

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
  onGenerateProof: () => Promise<{ success: boolean; error?: string }>;
  salesHistory: {
    day: number;
    sales: number;
    revenue: number;
    weather: string;
    advertisingCost: number;
    iceUsed: number;
    iceMelted: number;
    lemonsUsed: number;
    sugarUsed: number;
    recipe: {
      lemonsPerCup: number;
      sugarPerCup: number;
      icePerCup: number;
    };
    price: number;
    advertising: 'none' | 'flyers' | 'social' | 'radio';
  }[];
}

export const GameStatus: React.FC<GameStatusProps> = ({
  day,
  money,
  inventory,
  weather,
  lastResult,
  onReset,
  onGenerateProof,
  salesHistory
}) => {
  const { generateAndVerifyProof, isGenerating, error, status, eventData, hasSubmittedProof } = useGameProof();
  const [proofError, setProofError] = useState<string | null>(null);
  const proofUrl = useProofUrl();

  const handleGenerateProof = async () => {
    if (!lastResult?.gameOver || !lastResult.finalScore) {
      setProofError('Cannot generate proof before game is over');
      return;
    }

    const result = await onGenerateProof();
    if (!result.success) {
      setProofError(result.error || 'Failed to generate proof');
    }
  };

  // Get yesterday's weather from sales history
  const yesterdayWeather = salesHistory.length > 0 ? salesHistory[salesHistory.length - 1].weather : weather;

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
          <div className={styles.weatherInfo}>
            <div className={styles.weatherItem}>
              <span className={styles.weatherLabel}>Weather:</span>
              <span className={styles.weatherValue}>{weather}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onReset}
          className={styles.resetButton}
        >
          Reset Game
        </button>
      </div>

      {lastResult && (
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
                <span>{yesterdayWeather}</span>
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
          <p>Final Score: ${(lastResult.finalScore! / 10).toFixed(2)}</p>
          <p>{lastResult.won ? 'Congratulations! You won!' : 'Better luck next time!'}</p>
          
          <div className={styles.gameOverActions}>
            <button
              className={styles.proofButton}
              onClick={handleGenerateProof}
              disabled={isGenerating || hasSubmittedProof}
            >
              {isGenerating ? 'Generating Proof...' : hasSubmittedProof ? 'Proof Submitted' : 'Submit Proof'}
            </button>
            
            {error && <p className={styles.error}>{error}</p>}
            {status && <p className={styles.status}>{status}</p>}
            
            <div className={styles.proofLinks}>
              <a
                href={proofUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.zkverifyLink}
              >
                <button 
                  className={styles.zkverifyButton}
                  disabled={!proofUrl}
                >
                  View Proof on zkVerify
                </button>
              </a>
              {eventData?.transactionHash && (
                <a
                  href={`https://zkverify-testnet.subscan.io/extrinsic/${eventData.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.blockExplorerLink}
                >
                  <button className={styles.explorerButton}>
                    View Proof on Block Explorer
                  </button>
                </a>
              )}
              <a
                href={proofUrl ? `/proof-decoder?extrinsic=${proofUrl.split('/').pop()}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.decoderLink}
              >
                <button 
                  className={styles.decoderButton}
                  disabled={!proofUrl}
                >
                  Decode Proof Details
                </button>
              </a>
            </div>
            <div className={styles.proofInfo}>
              <h4>About the Zero-Knowledge Proof</h4>
              <p>
                This game uses zero-knowledge proofs to verify your score on-chain. The proof verifies:
              </p>
              <ul>
                <li>Your starting money (public input)</li>
                <li>Your final money (public input)</li>
                <li>Days played (public input)</li>
                <li>Daily money calculations (private inputs)</li>
                <li>Daily revenue (private inputs)</li>
                <li>Daily advertising costs (private inputs)</li>
              </ul>
              <p>
                The proof is generated using a Groth16 circuit and verified on-chain through zkVerify, ensuring fair play without revealing your private game state.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 