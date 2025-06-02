import React from 'react';
import styles from './WalletInstructions.module.css';

const WalletInstructions: React.FC = () => {
  return (
    <div className={styles.instructions}>
      <div className={styles.container}>
        <h2>Welcome to the Lemonade Stand Game! 🍋</h2>
        <div className={styles.steps}>
          <p><strong>To get started:</strong></p>
          <ol>
            <li>Connect your zkVerify wallet using the button in the top right</li>
            <li>Start with $20 initial capital</li>
            <li>Buy ingredients (lemons, sugar, ice)</li>
            <li>Set your recipe and price</li>
            <li>Choose advertising options</li>
            <li>Run your stand for 7 days</li>
          </ol>
          <p><strong>Goal:</strong> Make the most profit possible in 7 days!</p>
          <p className={styles.tip}>💡 Tip: Watch the weather forecast - it affects your sales!</p>
        </div>
      </div>
    </div>
  );
};

export default WalletInstructions; 