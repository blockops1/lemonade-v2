import { useState, useCallback } from 'react';
import { LemonadeStand } from '../game/LemonadeStand';

interface GameActions {
  buyIngredients: (item: 'lemons' | 'sugar' | 'ice', quantity: number) => boolean;
  setLemonadePrice: (price: number) => void;
  setAdvertising: (type: 'none' | 'flyers' | 'social' | 'radio') => boolean;
  simulateDay: () => {
    sales: number;
    revenue: number;
    weather: string;
    customersServed: number;
    gameOver: boolean;
    won: boolean;
    finalScore: number | null;
    advertisingCost: number;
  };
  getGameSummary: () => {
    totalDays: number;
    totalRevenue: number;
    totalCustomers: number;
    averageRevenuePerDay: number;
  };
}

export const useLemonadeGame = (): [ReturnType<LemonadeStand['getState']>, GameActions] => {
  const [game] = useState(() => new LemonadeStand());
  const [gameState, setGameState] = useState(() => game.getState());

  const updateState = useCallback(() => {
    setGameState(game.getState());
  }, [game]);

  const buyIngredients = useCallback((item: 'lemons' | 'sugar' | 'ice', quantity: number) => {
    const success = game.buyIngredients(item, quantity);
    if (success) {
      updateState();
    }
    return success;
  }, [game, updateState]);

  const setLemonadePrice = useCallback((price: number) => {
    game.setLemonadePrice(price);
    updateState();
  }, [game, updateState]);

  const setAdvertising = useCallback((type: 'none' | 'flyers' | 'social' | 'radio') => {
    const success = game.setAdvertising(type);
    if (success) {
      updateState();
    }
    return success;
  }, [game, updateState]);

  const simulateDay = useCallback(() => {
    const result = game.simulateDay();
    updateState();
    return result;
  }, [game, updateState]);

  const getGameSummary = useCallback(() => {
    return game.getGameSummary();
  }, [game]);

  return [
    gameState,
    {
      buyIngredients,
      setLemonadePrice,
      setAdvertising,
      simulateDay,
      getGameSummary
    }
  ];
}; 