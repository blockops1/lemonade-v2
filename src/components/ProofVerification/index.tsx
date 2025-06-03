import React, { useEffect, useState } from 'react';
import { useGroth16Proof } from '../../hooks/useGroth16Proof';
import styles from './ProofVerification.module.css';

interface ProofVerificationProps {
  gameData: {
    dailyStates: {
      money: number;
      lemons: number;
      sugar: number;
      ice: number;
    }[];
    dailyRecipes: {
      lemonsPerCup: number;
      sugarPerCup: number;
      icePerCup: number;
    }[];
    dailyPrices: number[];
    dailyWeather: number[];
    dailyAdvertising: number[];
    finalScore: number;
    startingMoney: number;
  };
  onVerificationComplete?: (isValid: boolean) => void;
}

export const ProofVerification: React.FC<ProofVerificationProps> = ({
  gameData,
  onVerificationComplete
}) => {
  const { verifyGameState, loading, error } = useGroth16Proof();
  const [verificationStatus, setVerificationStatus] = useState<{
    isValid?: boolean;
    error?: string;
  }>({});

  useEffect(() => {
    const verifyGame = async () => {
      try {
        const result = await verifyGameState(
          gameData.dailyStates,
          gameData.dailyRecipes,
          gameData.dailyPrices,
          gameData.dailyWeather,
          gameData.dailyAdvertising,
          gameData.finalScore,
          gameData.startingMoney
        );

        setVerificationStatus({ isValid: result.isValid });
        onVerificationComplete?.(result.isValid);
      } catch (err) {
        setVerificationStatus({
          error: err instanceof Error ? err.message : 'Failed to verify game state'
        });
        onVerificationComplete?.(false);
      }
    };

    verifyGame();
  }, [gameData, verifyGameState, onVerificationComplete]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          Verifying game state...
        </div>
      </div>
    );
  }

  if (error || verificationStatus.error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          Failed to verify game state: {error || verificationStatus.error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {verificationStatus.isValid !== undefined && (
        <div className={verificationStatus.isValid ? styles.valid : styles.invalid}>
          {verificationStatus.isValid ? (
            <>
              <h3>✅ Game Verified!</h3>
              <p>Your game state has been cryptographically verified.</p>
            </>
          ) : (
            <>
              <h3>❌ Verification Failed</h3>
              <p>The game state could not be verified. This may indicate tampering or a bug.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}; 