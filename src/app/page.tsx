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
    customersServed: number;
    gameOver: boolean;
    won: boolean;
    finalScore: number | null;
    advertisingCost: number;
  } | null>(null);
  
  const { selectedAccount, selectedWallet } = useAccount();
  const [gameState, gameActions] = useLemonadeGame();

  const handleSimulateDay = () => {
    const result = gameActions.simulateDay();
    setLastResult(result);
  };

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <Image
          src="/zk_Verify_logo_full_black.png"
          alt="zkVerify Logo"
          width={450}
          height={150}
        />

        <ConnectWalletButton onWalletConnected={() => {}} />

        <div className={styles.gameContainer}>
          <GameStatus
            day={gameState.day}
            money={gameState.money}
            inventory={gameState.inventory}
            weather={gameState.weather}
            lastResult={lastResult || undefined}
          />

          <GameControls
            onBuyIngredients={gameActions.buyIngredients}
            onSetPrice={gameActions.setLemonadePrice}
            onSetAdvertising={gameActions.setAdvertising}
            onSimulateDay={handleSimulateDay}
            disabled={!selectedAccount || !selectedWallet}
            currentMoney={gameState.money}
            currentAdvertising={gameState.advertising}
          />
        </div>
      </div>
    </div>
  );
}
