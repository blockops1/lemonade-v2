'use client';
import { useState } from 'react';
import { useAccount } from '@/context/AccountContext';
import ConnectWalletButton from '@/components/ConnectWalletButton';
import { GameControls } from '@/components/GameControls';
import { GameStatus } from '@/components/GameStatus';
import { useLemonadeGame } from '@/hooks/useLemonadeGame';
import { useGameProof } from '@/hooks/useGameProof';
import styles from './page.module.css';
import Image from 'next/image';
import WalletInstructions from "@/components/WalletInstructions";
import { setGlobalProofUrl } from '@/utils/globalState';
import { testGameData } from '@/utils/testProof';

export default function Home() {
  const [lastResult, setLastResult] = useState<{
    sales: number;
    revenue: number;
    weather: string;
    yesterdayWeather: string;
    customersServed: number;
    gameOver: boolean;
    won: boolean;
    finalScore: number | null;
    advertisingCost: number;
    iceUsed: number;
    iceMelted: number;
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
  } | null>(null);
  
  const { selectedAccount, selectedWallet } = useAccount();
  const [gameState, gameActions] = useLemonadeGame();
  const { generateAndVerifyProof, resetProofState } = useGameProof();

  const handleSimulateDay = () => {
    const result = gameActions.simulateDay();
    setLastResult({
      sales: result.sales,
      revenue: result.revenue,
      weather: result.weather,
      yesterdayWeather: result.yesterdayWeather,
      customersServed: result.customersServed,
      gameOver: result.gameOver,
      won: result.won,
      finalScore: result.finalScore,
      advertisingCost: result.advertisingCost,
      iceUsed: result.iceUsed,
      iceMelted: result.iceMelted,
      lemonsUsed: result.lemonsUsed,
      sugarUsed: result.sugarUsed,
      financialDetails: result.financialDetails
    });
  };

  const handleReset = () => {
    gameActions.resetGame();
    setLastResult(null);
    setGlobalProofUrl(null);
    resetProofState();
  };

  const handleGenerateProof = async (): Promise<{ success: boolean; error?: string }> => {
    console.log('\n=== STARTING PROOF GENERATION FROM PAGE ===');
    console.log('Wallet state:', {
      selectedAccount,
      selectedWallet
    });

    if (!selectedAccount || !selectedWallet) {
      console.error('Cannot generate proof: No wallet connected');
      return {
        success: false,
        error: 'Please connect your wallet first'
      };
    }

    if (!lastResult?.gameOver || !lastResult.finalScore) {
      console.error('Cannot generate proof: Game is not over or no final score');
      return {
        success: false,
        error: 'Game must be over to generate proof'
      };
    }

    console.log('Game state for proof:', {
      finalScore: lastResult.finalScore,
      salesHistory: gameState.salesHistory
    });

    try {
      console.log('Calling generateAndVerifyProof from useGameProof...');
      const result = await generateAndVerifyProof({
        dailyStates: gameState.salesHistory.map(day => [
          day.revenue,
          day.lemonsUsed,
          day.sugarUsed,
          day.iceUsed
        ]),
        dailyRecipes: gameState.salesHistory.map(day => [
          day.recipe.lemonsPerCup,
          day.recipe.sugarPerCup,
          day.recipe.icePerCup
        ]),
        dailyPrices: gameState.salesHistory.map(day => day.price),
        dailyWeather: gameState.salesHistory.map(day => {
          const weatherMap: { [key: string]: number } = {
            'Sunny': 0,
            'Hot': 1,
            'Cloudy': 2,
            'Rainy': 3
          };
          return weatherMap[day.weather];
        }),
        dailyAdvertising: gameState.salesHistory.map(day => {
          const advertisingMap: { [key: string]: number } = {
            'none': 0,
            'flyers': 1,
            'social': 2,
            'radio': 3
          };
          return advertisingMap[day.advertising];
        }),
        finalScore: lastResult.finalScore,
        startingMoney: 1200 // $120.00 in 10-cent units
      });

      console.log('Proof generation result:', result);
      return result;
    } catch (error) {
      console.error('Error in handleGenerateProof:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate proof'
      };
    }
  };

  const handleTestProof = async () => {
    console.log('\n=== STARTING TEST PROOF GENERATION ===');
    console.log('Wallet state:', {
      selectedAccount,
      selectedWallet
    });

    if (!selectedAccount || !selectedWallet) {
      console.error('Cannot generate test proof: No wallet connected');
      return;
    }

    try {
      console.log('Generating test proof with data:', testGameData);
      const result = await generateAndVerifyProof(testGameData);
      console.log('Test proof generation result:', result);
    } catch (error) {
      console.error('Error in handleTestProof:', error);
    }
  };

  return (
    <main>
      <WalletInstructions />
      <div className={styles.page}>
        <div className={styles.main}>
          <Image
            src="/lemonade2.jpg"
            alt="Lemonade Stand"
            width={600}
            height={400}
            priority
            style={{ 
              objectFit: 'cover', 
              objectPosition: 'center top',
              borderRadius: '8px',
              maxHeight: '300px'
            }}
          />

          <ConnectWalletButton onWalletConnected={() => {}} />

          <div className={styles.gameContainer}>
            <GameStatus
              day={gameState.day}
              money={gameState.money}
              inventory={gameState.inventory}
              weather={gameState.weather}
              lastResult={lastResult || undefined}
              onReset={handleReset}
              onGenerateProof={handleGenerateProof}
              salesHistory={gameState.salesHistory}
            />

            <GameControls
              onBuyIngredients={gameActions.buyIngredients}
              onSetPrice={gameActions.setLemonadePrice}
              onSetAdvertising={gameActions.setAdvertising}
              onSimulateDay={handleSimulateDay}
              disabled={!selectedAccount || !selectedWallet}
              currentMoney={gameState.money}
              currentAdvertising={gameState.advertising}
              gameOver={lastResult?.gameOver || false}
              inventory={gameState.inventory}
            />
          </div>

          <div className={styles.decoderLink}>
            <a
              href="/proof-decoder"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Proof Decoder
            </a>
            <a
              href="/leaderboard"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Leaderboard
            </a>
            <a
              href="/daily-winners"
              target="_blank"
              rel="noopener noreferrer"
            >
              Daily Winners
            </a>
            <button
              onClick={handleReset}
              className={styles.resetButton}
            >
              Restart Game
            </button>
          </div>

          <div className={styles.testSection}>
            <button
              onClick={handleTestProof}
              className={styles.testButton}
              disabled={!selectedAccount || !selectedWallet}
            >
              Generate Test Proof
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
