'use client';
import { useState } from 'react';
import { useAccount } from '@/context/AccountContext';
import ConnectWalletButton from '@/components/ConnectWalletButton';
import { GameControls } from '@/components/GameControls';
import { GameStatus } from '@/components/GameStatus';
import { useLemonadeGame } from '@/hooks/useLemonadeGame';
import styles from './page.module.css';
import Image from 'next/image';

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
      financialDetails: {
        revenue: result.revenue,
        costs: {
          total: result.advertisingCost + (result.lemonsUsed * 0.5 + result.sugarUsed * 0.3 + result.iceUsed * 0.2),
          ingredients: {
            total: result.lemonsUsed * 0.5 + result.sugarUsed * 0.3 + result.iceUsed * 0.2,
            lemons: result.lemonsUsed * 0.5,
            sugar: result.sugarUsed * 0.3,
            ice: result.iceUsed * 0.2
          },
          advertising: result.advertisingCost
        },
        profit: result.revenue - (result.advertisingCost + (result.lemonsUsed * 0.5 + result.sugarUsed * 0.3 + result.iceUsed * 0.2))
      }
    });
  };

  const handleReset = () => {
    gameActions.resetGame();
    setLastResult(null);
  };

  const handleGenerateProof = async () => {
    if (!selectedAccount || !selectedWallet) {
      return {
        success: false,
        error: 'Please connect your wallet first'
      };
    }
    return gameActions.generateAndVerifyProof();
  };

  return (
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
          />
        </div>
      </div>
    </div>
  );
}
