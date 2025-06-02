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
}

export const GameControls: React.FC<GameControlsProps> = ({
  onBuyIngredients,
  onSetPrice,
  onSetAdvertising,
  onSimulateDay,
  disabled = false,
  currentMoney,
  currentAdvertising
}) => {
  const [quantities, setQuantities] = useState({
    lemons: 0,
    sugar: 0,
    ice: 0
  });
  const [price, setPrice] = useState(1.00);

  const PRICE_OPTIONS = [
    0.25, 0.50, 0.75, 1.00, 1.25, 1.50, 1.75, 2.00
  ];

  const handleQuantityChange = (item: 'lemons' | 'sugar' | 'ice', value: string) => {
    const quantity = parseInt(value) || 0;
    setQuantities(prev => ({
      ...prev,
      [item]: quantity
    }));
  };

  const handleBuy = (item: 'lemons' | 'sugar' | 'ice') => {
    if (quantities[item] > 0) {
      onBuyIngredients(item, quantities[item]);
    }
  };

  const handlePriceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPrice = parseFloat(event.target.value);
    setPrice(newPrice);
    onSetPrice(newPrice);
  };

  return (
    <div className={styles.controls}>
      <div className={styles.inventory}>
        <h3>Buy Ingredients</h3>
        <p>Available Money: ${currentMoney.toFixed(2)}</p>
        
        <div className={styles.ingredientControl}>
          <label>
            Lemons ($0.05 each):
            <input
              type="number"
              min="0"
              value={quantities.lemons}
              onChange={(e) => handleQuantityChange('lemons', e.target.value)}
              disabled={disabled}
            />
          </label>
          <button 
            onClick={() => handleBuy('lemons')}
            disabled={disabled || quantities.lemons === 0}
          >
            Buy Lemons
          </button>
        </div>

        <div className={styles.ingredientControl}>
          <label>
            Sugar ($0.03 each):
            <input
              type="number"
              min="0"
              value={quantities.sugar}
              onChange={(e) => handleQuantityChange('sugar', e.target.value)}
              disabled={disabled}
            />
          </label>
          <button 
            onClick={() => handleBuy('sugar')}
            disabled={disabled || quantities.sugar === 0}
          >
            Buy Sugar
          </button>
        </div>

        <div className={styles.ingredientControl}>
          <label>
            Ice ($0.02 each):
            <input
              type="number"
              min="0"
              value={quantities.ice}
              onChange={(e) => handleQuantityChange('ice', e.target.value)}
              disabled={disabled}
            />
          </label>
          <button 
            onClick={() => handleBuy('ice')}
            disabled={disabled || quantities.ice === 0}
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
        <p>Current: {currentAdvertising.type} (Cost: ${currentAdvertising.cost.toFixed(2)}, Customer Multiplier: {currentAdvertising.multiplier}x)</p>
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
            disabled={disabled || currentMoney < 3}
            className={`${styles.adButton} ${currentAdvertising.type === 'flyers' ? styles.selected : ''}`}
          >
            <span className={styles.adType}>Flyers</span>
            <span className={styles.adCost}>$3/day</span>
            <span className={styles.adEffect}>+20% Customers</span>
          </button>
          <button
            onClick={() => onSetAdvertising('social')}
            disabled={disabled || currentMoney < 8}
            className={`${styles.adButton} ${currentAdvertising.type === 'social' ? styles.selected : ''}`}
          >
            <span className={styles.adType}>Social Media</span>
            <span className={styles.adCost}>$8/day</span>
            <span className={styles.adEffect}>+80% Customers</span>
          </button>
          <button
            onClick={() => onSetAdvertising('radio')}
            disabled={disabled || currentMoney < 15}
            className={`${styles.adButton} ${currentAdvertising.type === 'radio' ? styles.selected : ''}`}
          >
            <span className={styles.adType}>Radio</span>
            <span className={styles.adCost}>$15/day</span>
            <span className={styles.adEffect}>+150% Customers</span>
          </button>
        </div>
      </div>

      <button
        className={styles.simulateButton}
        onClick={onSimulateDay}
        disabled={disabled}
      >
        Start Day
      </button>
    </div>
  );
}; 