import React from 'react';
import styles from './WalletInstructions.module.css';
import { isMobile } from '@/utils/device';

const WalletInstructions: React.FC = () => {
  const mobile = isMobile();

  return (
    <div className={styles.instructions}>
      <div className={styles.container}>
        <h2>Welcome to the Lemonade Stand Game! 🍋</h2>
        <div className={styles.steps}>
          <p><strong>To get started:</strong></p>
          {mobile ? (
            <>
              <p>📱 <strong>Mobile Users:</strong></p>
              <ol>
                <li>Click the "Connect Wallet" button below</li>
                <li>Choose your preferred wallet:
                  <ul>
                    <li>Talisman Wallet - A secure wallet for Polkadot and Substrate chains</li>
                    <li>SubWallet - A comprehensive wallet for the Polkadot ecosystem</li>
                  </ul>
                </li>
                <li>You'll be redirected to your chosen wallet app</li>
                <li>Approve the connection in the wallet app</li>
                <li>You'll be returned to the game automatically</li>
              </ol>
            </>
          ) : (
            <ol>
              <li>Connect your zkVerify wallet using the green button below</li>
            </ol>
          )}
          <p>Then:</p>
          <ol>
            <li>Start with $120.00 initial capital</li>
            <li>Buy ingredients:
              <ul>
                <li>Lemons: $0.50 each</li>
                <li>Sugar: $0.30 each</li>
                <li>Ice: $0.20 each</li>
              </ul>
            </li>
            <li>Set your price per cup (between $0.50 and $6.00)</li>
            <li>Choose advertising options</li>
            <li>Run your stand for 7 days</li>
          </ol>
          <p><strong>Recipe:</strong> Each cup of lemonade requires:</p>
          <ul>
            <li>2 lemons</li>
            <li>1 sugar</li>
            <li>3 ice cubes (all ice melts at end of day)</li>
          </ul>
          <p><strong>Goal:</strong> Make the most profit possible in 7 days!</p>
          <p className={styles.tip}>💡 Tip: Watch the weather forecast - it affects your sales!</p>
          <p className={styles.github}>
            <a 
              href="https://github.com/blockops1/lemonade-v2" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              View source code on GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletInstructions; 