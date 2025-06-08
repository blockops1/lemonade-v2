import React from 'react';
import styles from './ingredients.module.css';

interface IngredientIconProps {
  type: 'lemon' | 'sugar' | 'ice';
  className?: string;
}

export const IngredientIcon: React.FC<IngredientIconProps> = ({ type, className }) => {
  const getIcon = () => {
    switch (type) {
      case 'lemon':
        return (
          <svg viewBox="0 0 24 24" className={`${styles.ingredientIcon} ${styles.lemonIcon} ${className || ''}`}>
            <path fill="currentColor" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8 S16.41,20,12,20z M12,6c-3.31,0-6,2.69-6,6s2.69,6,6,6s6-2.69,6-6S15.31,6,12,6z M12,16c-2.21,0-4-1.79-4-4s1.79-4,4-4s4,1.79,4,4 S14.21,16,12,16z"/>
          </svg>
        );
      case 'sugar':
        return (
          <svg viewBox="0 0 24 24" className={`${styles.ingredientIcon} ${styles.sugarIcon} ${className || ''}`}>
            <path fill="currentColor" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8 s8,3.59,8,8S16.41,20,12,20z M12,6c-3.31,0-6,2.69-6,6s2.69,6,6,6s6-2.69,6-6S15.31,6,12,6z M12,16c-2.21,0-4-1.79-4-4 s1.79-4,4-4s4,1.79,4,4S14.21,16,12,16z"/>
          </svg>
        );
      case 'ice':
        return (
          <svg viewBox="0 0 24 24" className={`${styles.ingredientIcon} ${styles.iceIcon} ${className || ''}`}>
            <path fill="currentColor" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8 s3.59-8,8-8s8,3.59,8,8S16.41,20,12,20z M12,6c-3.31,0-6,2.69-6,6s2.69,6,6,6s6-2.69,6-6S15.31,6,12,6z M12,16 c-2.21,0-4-1.79-4-4s1.79-4,4-4s4,1.79,4,4S14.21,16,12,16z"/>
          </svg>
        );
    }
  };

  return getIcon();
}; 