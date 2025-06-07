import React, { useState } from 'react';
import styles from './GameControls.module.css';
import ingredientStyles from './ingredients.module.css';
import { IngredientIcon } from './IngredientIcons';

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
  const [price, setPrice] = useState(3.00);

  const PRICE_OPTIONS = [
    0.50, 1.00, 2.00, 2.50, 3.00, 3.50, 4.00, 5.00, 6.00
  ];

  const handleQuantityChange = (item: 'lemons' | 'sugar' | 'ice', value: string) => {
    setQuantities(prev => ({
      ...prev,
      [item]: value
    }));
  };

  const handleBuy = (item: 'lemons' | 'sugar' | 'ice') => {
    const quantity = parseInt(quantities[item]) || 0;
    if (quantity > 0) {
      const success = onBuyIngredients(item, quantity);
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
        
        <div className={ingredientStyles.ingredientControl}>
          <div className={ingredientStyles.ingredientLabel}>
            <IngredientIcon type="lemon" />
            <span>Lemons</span>
            <span className={ingredientStyles.ingredientPrice}>($0.50 each)</span>
          </div>
          <div className={ingredientStyles.ingredientQuantity}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={quantities.lemons}
              onChange={(e) => handleQuantityChange('lemons', e.target.value)}
              disabled={disabled}
              className={ingredientStyles.ingredientInput}
            />
            <button 
              onClick={() => handleBuy('lemons')}
              disabled={disabled || !quantities.lemons || parseInt(quantities.lemons) === 0}
              className={ingredientStyles.ingredientButton}
            >
              Buy
            </button>
          </div>
        </div>

        <div className={ingredientStyles.ingredientControl}>
          <div className={ingredientStyles.ingredientLabel}>
            <IngredientIcon type="sugar" />
            <span>Sugar</span>
            <span className={ingredientStyles.ingredientPrice}>($0.30 each)</span>
          </div>
          <div className={ingredientStyles.ingredientQuantity}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={quantities.sugar}
              onChange={(e) => handleQuantityChange('sugar', e.target.value)}
              disabled={disabled}
              className={ingredientStyles.ingredientInput}
            />
            <button 
              onClick={() => handleBuy('sugar')}
              disabled={disabled || !quantities.sugar || parseInt(quantities.sugar) === 0}
              className={ingredientStyles.ingredientButton}
            >
              Buy
            </button>
          </div>
        </div>

        <div className={ingredientStyles.ingredientControl}>
          <div className={ingredientStyles.ingredientLabel}>
            <IngredientIcon type="ice" />
            <span>Ice</span>
            <span className={ingredientStyles.ingredientPrice}>($0.20 each)</span>
          </div>
          <div className={ingredientStyles.ingredientQuantity}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={quantities.ice}
              onChange={(e) => handleQuantityChange('ice', e.target.value)}
              disabled={disabled}
              className={ingredientStyles.ingredientInput}
            />
            <button 
              onClick={() => handleBuy('ice')}
              disabled={disabled || !quantities.ice || parseInt(quantities.ice) === 0}
              className={ingredientStyles.ingredientButton}
            >
              Buy
            </button>
          </div>
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
        <h3>Advertising</h3>
        <p>Choose your advertising strategy:</p>
        <div className={styles.advertisingOptions}>
          <button
            className={`${styles.adButton} ${currentAdvertising.type === 'none' ? styles.selected : ''}`}
            onClick={() => onSetAdvertising('none')}
            disabled={disabled}
          >
            <span className={styles.adType}>No Ads</span>
            <span className={styles.adCost}>$0.00</span>
            <span className={styles.adEffect}>-20% customers</span>
          </button>
          <button
            className={`${styles.adButton} ${currentAdvertising.type === 'flyers' ? styles.selected : ''}`}
            onClick={() => onSetAdvertising('flyers')}
            disabled={disabled}
          >
            <span className={styles.adType}>Flyers</span>
            <span className={styles.adCost}>$9.00</span>
            <span className={styles.adEffect}>+20% customers</span>
          </button>
          <button
            className={`${styles.adButton} ${currentAdvertising.type === 'social' ? styles.selected : ''}`}
            onClick={() => onSetAdvertising('social')}
            disabled={disabled}
          >
            <span className={styles.adType}>Social Media</span>
            <span className={styles.adCost}>$24.00</span>
            <span className={styles.adEffect}>+80% customers</span>
          </button>
          <button
            className={`${styles.adButton} ${currentAdvertising.type === 'radio' ? styles.selected : ''}`}
            onClick={() => onSetAdvertising('radio')}
            disabled={disabled}
          >
            <span className={styles.adType}>Radio</span>
            <span className={styles.adCost}>$45.00</span>
            <span className={styles.adEffect}>+150% customers</span>
          </button>
        </div>
      </div>

      <button
        className={styles.simulateButton}
        onClick={onSimulateDay}
        disabled={disabled}
      >
        Simulate Day
      </button>
    </div>
  );
};