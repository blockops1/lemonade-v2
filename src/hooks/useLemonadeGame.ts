import { useState, useCallback } from 'react';
import { LemonadeStand } from '../game/LemonadeStand';
import { useGroth16Proof } from './useGroth16Proof';
import { useZkVerify, VerificationKey } from './useZkVerify';

interface GameActions {
  buyIngredients: (item: 'lemons' | 'sugar' | 'ice', quantity: number) => boolean;
  setLemonadePrice: (price: number) => void;
  setAdvertising: (type: 'none' | 'flyers' | 'social' | 'radio') => boolean;
  simulateDay: () => {
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
  };
  resetGame: () => void;
  getGameSummary: () => {
    totalDays: number;
    totalRevenue: number;
    totalCustomers: number;
    averageRevenuePerDay: number;
  };
  generateAndVerifyProof: () => Promise<{
    success: boolean;
    error?: string;
  }>;
}

export const useLemonadeGame = (): [ReturnType<LemonadeStand['getState']>, GameActions] => {
  const [game] = useState(() => new LemonadeStand());
  const [gameState, setGameState] = useState(() => game.getState());
  const { verifyGameState } = useGroth16Proof();
  const { onVerifyProof } = useZkVerify();

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

  const resetGame = useCallback(() => {
    game.resetGame();
    updateState();
  }, [game, updateState]);

  const getGameSummary = useCallback(() => {
    return game.getGameSummary();
  }, [game]);

  const generateAndVerifyProof = useCallback(async () => {
    console.log('\n=== STARTING PROOF GENERATION ===');
    console.log('Game State:', {
      day: gameState.day,
      money: gameState.money,
      inventory: gameState.inventory,
      prices: gameState.prices,
      advertising: gameState.advertising,
      gameOver: gameState.gameOver,
      won: gameState.won,
      finalScore: gameState.finalScore
    });

    if (!gameState.gameOver) {
      console.error('Cannot generate proof: Game is not over');
      return { success: false, error: 'Game must be over to generate proof' };
    }

    try {
      console.log('\n=== SALES HISTORY ANALYSIS ===');
      console.log('Raw sales history:', JSON.stringify(gameState.salesHistory, null, 2));
      console.log('Sales history length:', gameState.salesHistory.length);
      
      // First, validate we have all 7 days of data
      if (gameState.salesHistory.length !== 7) {
        throw new Error(`Expected 7 days of data, but got ${gameState.salesHistory.length} days`);
      }

      // Sort sales history by day to ensure correct order
      const sortedHistory = [...gameState.salesHistory].sort((a, b) => a.day - b.day);
      console.log('\nSorted sales history:', JSON.stringify(sortedHistory, null, 2));

      // Log each day's data in detail
      console.log('\n=== DETAILED DAY ANALYSIS ===');
      sortedHistory.forEach((day, index) => {
        console.log(`\nDay ${day.day} (index ${index}):`, {
          sales: day.sales,
          revenue: day.revenue,
          weather: day.weather,
          advertisingCost: day.advertisingCost,
          iceUsed: day.iceUsed,
          iceMelted: day.iceMelted,
          lemonsUsed: day.lemonsUsed,
          sugarUsed: day.sugarUsed,
          recipe: day.recipe,
          price: day.price,
          advertising: day.advertising
        });
      });

      console.log('\n=== CONVERTING TO CIRCUIT FORMAT ===');
      // Convert sales history to circuit input format
      const dailyStates = sortedHistory.map(day => [
        day.revenue, // money
        day.lemonsUsed, // lemons
        day.sugarUsed, // sugar
        day.iceUsed // ice
      ]);

      const dailyRecipes = sortedHistory.map(day => [
          day.recipe.lemonsPerCup,
          day.recipe.sugarPerCup,
          day.recipe.icePerCup
      ]);

      const dailyPrices = sortedHistory.map(day => day.price);
      
      // Convert weather strings to numbers
        const weatherMap: { [key: string]: number } = {
        'Sunny': 0,
        'Hot': 1,
        'Cloudy': 2,
        'Rainy': 3
        };
      const dailyWeather = sortedHistory.map(day => weatherMap[day.weather]);

      // Convert advertising types to numbers
      const advertisingMap: { [key: string]: number } = {
        'none': 0,
        'flyers': 1,
        'social': 2,
        'radio': 3
      };
      const dailyAdvertising = sortedHistory.map(day => 
        advertisingMap[day.advertising]
      );

      // Use final score for the circuit
      const finalMoney = gameState.finalScore || 0;
      const startingMoneyInTens = 1200; // Use the correct initial money value (1200 = $120.00 in 10-cent units)

      console.log('Generating proof with:', {
        finalMoney,
        startingMoneyInTens,
        daysPlayed: dailyStates.length,
        dailyStates,
        dailyRecipes,
        dailyPrices,
        dailyWeather,
        dailyAdvertising
      });

      const proofResult = await verifyGameState(
        dailyStates.map(state => ({
          money: state[0],
          lemons: state[1],
          sugar: state[2],
          ice: state[3]
        })),
        dailyRecipes.map(recipe => ({
          lemonsPerCup: recipe[0],
          sugarPerCup: recipe[1],
          icePerCup: recipe[2]
        })),
        dailyPrices,
        dailyWeather,
        dailyAdvertising,
        finalMoney,  // Use finalMoney instead of finalScoreInTens
        startingMoneyInTens
      );

      if (!proofResult.isValid) {
        console.error('Generated proof is invalid');
        return { success: false, error: 'Generated proof is invalid' };
      }

      // Load the registered verification key hash
      console.log('\n=== LOADING REGISTERED VERIFICATION KEY HASH ===');
      const vkData = await fetch('/vkey.json').then(res => res.json());
      const vkHash = vkData.hash;

      // Send proof to zkVerify
      console.log('\n=== SENDING PROOF TO ZKVERIFY ===');
      await onVerifyProof(JSON.stringify(proofResult.proof), proofResult.publicSignals, vkHash);

      return { success: true };
    } catch (error) {
      console.error('Error generating proof:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate proof' 
      };
    }
  }, [gameState, verifyGameState, onVerifyProof]);

  return [
    gameState,
    {
      buyIngredients,
      setLemonadePrice,
      setAdvertising,
      simulateDay,
      resetGame,
      getGameSummary,
      generateAndVerifyProof
    }
  ];
}; 