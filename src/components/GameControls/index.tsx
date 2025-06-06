import React, { useState } from 'react';
import styles from './GameControls.module.css';

interface GameControlsProps {
  onBuyIngredients: (item: 'lemons' | 'sugar' | 'ice', quantity: number) => boolean;
  onSetPrice: (price: number) => void;
  onSetAdvertising: (type: 'none' | 'flyers' | 'social' | 'radio') => void;
  onSimulateDay: () => void;
  disabled?: boolean;
  currentMoney: number;
  currentAdvertising: {
    type: 'none' | 'flyers' | 'social' | 'radio';
    cost: number;
    multiplier: number;
  };
  gameOver?: boolean;
  inventory: {
    lemons: number;
    sugar: number;
    ice: number;
  };
}

export const GameControls: React.FC<GameControlsProps> = ({
  onBuyIngredients,
  onSetPrice,
  onSetAdvertising,
  onSimulateDay,
  disabled = false,
  currentMoney,
  currentAdvertising,
  gameOver = false,
  inventory
}) => {
  const [quantities, setQuantities] = useState({
    lemons: '',
    sugar: '',
    ice: ''
  });
  const [price, setPrice] = useState(3.00);  // Start at $3.00

  const PRICE_OPTIONS = [
    0.50,  // 5 units - lowest price
    1.00,  // 10 units
    2.00,  // 20 units
    2.50,  // 25 units
    3.00,  // 30 units (default)
    3.50,  // 35 units
    4.00,  // 40 units
    5.00,  // 50 units
    6.00   // 60 units - highest price
  ];

  const handleQuantityChange = (item: 'lemons' | 'sugar' | 'ice', value: string) => {
    // Allow any input, including empty string
    setQuantities(prev => ({
      ...prev,
      [item]: value
    }));
  };

  const handleBuy = (item: 'lemons' | 'sugar' | 'ice') => {
    const quantity = parseInt(quantities[item]) || 0;
    if (quantity > 0) {
      const success = onBuyIngredients(item, quantity);
      // Only clear the input if the purchase failed
      if (!success) {
        setQuantities(prev => ({
          ...prev,
          [item]: ''
        }));
      }
    }
  };

  const handlePriceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPrice = parseFloat(event.target.value);
    setPrice(newPrice);
    onSetPrice(newPrice);
  };

  if (gameOver) {
    return null;
  }

  return (
    <div className={styles.controls}>
      <div className={styles.inventory}>
        <h3>Buy Ingredients</h3>
        <p>Available Money: ${(currentMoney / 10).toFixed(2)}</p>
        
        <div className={styles.ingredientControl}>
          <label>
            Lemons ($0.50 each):
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={quantities.lemons}
              onChange={(e) => handleQuantityChange('lemons', e.target.value)}
              disabled={disabled}
            />
          </label>
          <button 
            onClick={() => handleBuy('lemons')}
            disabled={disabled || !quantities.lemons || parseInt(quantities.lemons) === 0}
          >
            Buy Lemons
          </button>
        </div>

        <div className={styles.ingredientControl}>
          <label>
            Sugar ($0.30 each):
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={quantities.sugar}
              onChange={(e) => handleQuantityChange('sugar', e.target.value)}
              disabled={disabled}
            />
          </label>
          <button 
            onClick={() => handleBuy('sugar')}
            disabled={disabled || !quantities.sugar || parseInt(quantities.sugar) === 0}
          >
            Buy Sugar
          </button>
        </div>

        <div className={styles.ingredientControl}>
          <label>
            Ice ($0.20 each):
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={quantities.ice}
              onChange={(e) => handleQuantityChange('ice', e.target.value)}
              disabled={disabled}
            />
          </label>
          <button 
            onClick={() => handleBuy('ice')}
            disabled={disabled || !quantities.ice || parseInt(quantities.ice) === 0}
          >
            Buy Ice
          </button>
        </div>
      </div>

      <div className={styles.pricing}>
        <h3>Set Price</h3>
        <label>
          Lemonade Price:
          <select
            value={price}
            onChange={handlePriceChange}
            disabled={disabled}
            className={styles.priceSelect}
          >
            {PRICE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                ${option.toFixed(2)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.advertising}>
        <h3>Advertising Strategy</h3>
        <p>Current: {currentAdvertising.type} (Cost: ${(currentAdvertising.cost / 10).toFixed(2)}, Customer Multiplier: {currentAdvertising.multiplier}x)</p>
        <div className={styles.advertisingOptions}>
          <button
            onClick={() => onSetAdvertising('none')}
            disabled={disabled}
            className={`${styles.adButton} ${currentAdvertising.type === 'none' ? styles.selected : ''}`}
          >
            <span className={styles.adType}>No Advertising</span>
            <span className={styles.adCost}>Free</span>
            <span className={styles.adEffect}>-20% Customers</span>
          </button>
          <button
            onClick={() => onSetAdvertising('flyers')}
            disabled={disabled || currentMoney < 90}
            className={`${styles.adButton} ${currentAdvertising.type === 'flyers' ? styles.selected : ''}`}
          >
            <span className={styles.adType}>Flyers</span>
            <span className={styles.adCost}>$9/day</span>
            <span className={styles.adEffect}>+20% Customers</span>
          </button>
          <button
            onClick={() => onSetAdvertising('social')}
            disabled={disabled || currentMoney < 240}
            className={`${styles.adButton} ${currentAdvertising.type === 'social' ? styles.selected : ''}`}
          >
            <span className={styles.adType}>Social Media</span>
            <span className={styles.adCost}>$24/day</span>
            <span className={styles.adEffect}>+80% Customers</span>
          </button>
          <button
            onClick={() => onSetAdvertising('radio')}
            disabled={disabled || currentMoney < 450}
            className={`${styles.adButton} ${currentAdvertising.type === 'radio' ? styles.selected : ''}`}
          >
            <span className={styles.adType}>Radio</span>
            <span className={styles.adCost}>$45/day</span>
            <span className={styles.adEffect}>+150% Customers</span>
          </button>
        </div>
      </div>

      <button
        className={styles.simulateButton}
        onClick={onSimulateDay}
        disabled={disabled || (inventory.lemons === 0 && inventory.sugar === 0 && inventory.ice === 0)}
      >
        Start Day
      </button>
    </div>
  );
};