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
    customersServed: number;
    gameOver: boolean;
    won: boolean;
    finalScore: number | null;
    advertisingCost: number;
    iceUsed: number;
    iceMelted: number;
    lemonsUsed: number;
    sugarUsed: number;
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
      
      type DailyState = [number, number, number, number]; // [money, lemons, sugar, ice]
      const dailyStates: DailyState[] = [];

      // Calculate states iteratively instead of using map
      let prevMoney = 2000; // Starting money in cents (20.00)
      let prevLemons = 0;
      let prevSugar = 0;
      let prevIce = 0;
      
      for (let index = 0; index < sortedHistory.length; index++) {
        const day = sortedHistory[index];
        
        // Calculate revenue and costs in cents
        const revenueInCents = Math.floor(day.revenue * 100);
        const adCostInCents = day.advertisingCost * 100;
        const ingredientCostInCents = 
          (day.lemonsUsed * 5) +  // 5 cents per lemon
          (day.sugarUsed * 3) +   // 3 cents per sugar
          ((day.iceUsed + day.iceMelted) * 2);  // 2 cents per ice

        // Calculate current money according to circuit validation
        const currMoney = prevMoney + revenueInCents - (ingredientCostInCents + adCostInCents);

        // Calculate current inventory according to circuit validation
        const currLemons = day.lemonsUsed;  // What was used this day
        const currSugar = day.sugarUsed;    // What was used this day
        const currIce = 0;                  // Ice always melts

        // Verify money is within circuit bounds
        if (currMoney > 65535 || currMoney < 0) {
          throw new Error(`Money value ${currMoney} exceeds circuit's 16-bit limit on day ${day.day}`);
        }

        dailyStates.push([
          currMoney,
          currLemons,
          currSugar,
          currIce
        ]);

        console.log(`\nProcessing state for Day ${day.day}:`, {
          revenueInCents,
          adCostInCents,
          ingredientCostInCents,
          prevMoney,
          currMoney,
          lemonsUsed: day.lemonsUsed,
          sugarUsed: day.sugarUsed,
          iceUsed: day.iceUsed,
          iceMelted: day.iceMelted,
          revenue: day.revenue,
          advertisingCost: day.advertisingCost
        });

        // Update previous state for next iteration
        prevMoney = currMoney;
        prevLemons = currLemons;
        prevSugar = currSugar;
        prevIce = currIce;
      }

      console.log('\nDaily States:', JSON.stringify(dailyStates, null, 2));

      const dailyRecipes = sortedHistory.map(day => {
        console.log(`\nProcessing recipe for Day ${day.day}:`, {
          recipe: day.recipe,
          hasRecipe: !!day.recipe,
          recipeType: typeof day.recipe,
          recipeKeys: day.recipe ? Object.keys(day.recipe) : 'no recipe',
          lemonsPerCup: day.recipe?.lemonsPerCup,
          sugarPerCup: day.recipe?.sugarPerCup,
          icePerCup: day.recipe?.icePerCup
        });
        
        if (!day.recipe) {
          throw new Error(`Missing recipe for day ${day.day}`);
        }

        // Validate recipe against circuit constraints
        if (day.recipe.lemonsPerCup < 2 || day.recipe.lemonsPerCup > 6) {
          throw new Error(`Invalid recipe on day ${day.day}: Lemons must be between 2-6 per cup`);
        }
        if (day.recipe.sugarPerCup < 1 || day.recipe.sugarPerCup > 3) {
          throw new Error(`Invalid recipe on day ${day.day}: Sugar must be between 1-3 per cup`);
        }
        if (day.recipe.icePerCup < 3 || day.recipe.icePerCup > 9) {
          throw new Error(`Invalid recipe on day ${day.day}: Ice must be between 3-9 per cup`);
        }

        return [
          day.recipe.lemonsPerCup,
          day.recipe.sugarPerCup,
          day.recipe.icePerCup
        ];
      });

      console.log('\nDaily Recipes:', JSON.stringify(dailyRecipes, null, 2));

      const dailyPrices = sortedHistory.map(day => {
        // Convert price to cents
        const priceInCents = Math.floor(day.price * 100);
        if (priceInCents <= 0) {
          throw new Error(`Invalid price on day ${day.day}: Must be greater than 0`);
        }
        return priceInCents;
      });

      console.log('\nDaily Prices (in cents):', JSON.stringify(dailyPrices, null, 2));

      const dailyWeather = sortedHistory.map(day => {
        // Convert weather string to circuit value
        const weatherMap: { [key: string]: number } = {
          'rainy': 0,    // Circuit: 0=rainy
          'cloudy': 1,   // Circuit: 1=cloudy
          'sunny': 2,    // Circuit: 2=sunny
          'hot': 3       // Circuit: 3=hot
        };
        const weatherValue = weatherMap[day.weather.toLowerCase()];  // Convert to lowercase to match game state
        if (weatherValue === undefined) {
          throw new Error(`Invalid weather on day ${day.day}: ${day.weather}`);
        }
        console.log(`Weather for day ${day.day}: ${day.weather.toLowerCase()} -> ${weatherValue}`);
        return weatherValue;
      });

      console.log('\nDaily Weather:', JSON.stringify(dailyWeather, null, 2));

      const dailyAdvertising = sortedHistory.map(day => {
        // Convert advertising cost to circuit value
        let adValue;
        switch (day.advertisingCost) {
          case 0:
            adValue = 0;  // none
            break;
          case 3:
            adValue = 1;  // flyers ($3)
            break;
          case 8:
            adValue = 2;  // social ($8)
            break;
          case 15:
            adValue = 3;  // radio ($15)
            break;
          default:
            throw new Error(`Invalid advertising cost on day ${day.day}: ${day.advertisingCost}`);
        }
        console.log(`Advertising for day ${day.day}: cost ${day.advertisingCost} -> ${adValue}`);
        return adValue;
      });

      console.log('\nDaily Advertising:', JSON.stringify(dailyAdvertising, null, 2));

      // Validate all arrays have the correct length
      console.log('\n=== VALIDATING ARRAY LENGTHS ===');
      console.log('Array lengths:', {
        states: dailyStates.length,
        recipes: dailyRecipes.length,
        prices: dailyPrices.length,
        weather: dailyWeather.length,
        advertising: dailyAdvertising.length
      });

      if (dailyStates.length !== 7 || dailyRecipes.length !== 7 || 
          dailyPrices.length !== 7 || dailyWeather.length !== 7 || 
          dailyAdvertising.length !== 7) {
        throw new Error(`Invalid array lengths: states=${dailyStates.length}, recipes=${dailyRecipes.length}, prices=${dailyPrices.length}, weather=${dailyWeather.length}, advertising=${dailyAdvertising.length}`);
      }

      // Validate all inner arrays have the correct length
      console.log('\n=== VALIDATING INNER ARRAY LENGTHS ===');
      dailyStates.forEach((state: DailyState, i: number) => {
        console.log(`State array for day ${i + 1}:`, {
          length: state.length,
          values: state
        });
        if (state.length !== 4) {
          throw new Error(`Invalid state array length at day ${i + 1}: ${state.length}`);
        }
      });

      dailyRecipes.forEach((recipe, i) => {
        console.log(`Recipe array for day ${i + 1}:`, {
          length: recipe.length,
          values: recipe
        });
        if (recipe.length !== 3) {
          throw new Error(`Invalid recipe array length at day ${i + 1}: ${recipe.length}`);
        }
      });

      console.log('\n=== FINAL DATA FOR CIRCUIT ===');
      console.log('dailyStates:', JSON.stringify(dailyStates, null, 2));
      console.log('dailyRecipes:', JSON.stringify(dailyRecipes, null, 2));
      console.log('dailyPrices:', JSON.stringify(dailyPrices, null, 2));
      console.log('dailyWeather:', JSON.stringify(dailyWeather, null, 2));
      console.log('dailyAdvertising:', JSON.stringify(dailyAdvertising, null, 2));
      console.log('finalScore:', gameState.finalScore);
      console.log('startingMoney:', 20.00);

      // Convert final score and starting money to cents for circuit
      const finalScoreInCents = Math.floor((gameState.finalScore || 0) * 100);
      const startingMoneyInCents = Math.floor(20.00 * 100);

      console.log('\n=== GENERATING PROOF ===');
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
        finalScoreInCents,
        startingMoneyInCents
      );

      if (!proofResult.isValid) {
        return { success: false, error: 'Generated proof is invalid' };
      }

      // Import verification key
      console.log('\n=== IMPORTING VERIFICATION KEY ===');
      const vkModule = await import('../circuits/groth16/build/lemonade_new_verification_key.json');
      const vk: VerificationKey = {
        protocol: vkModule.default.protocol,
        curve: vkModule.default.curve,
        nPublic: vkModule.default.nPublic,
        vk_alpha_1: vkModule.default.vk_alpha_1,
        vk_beta_2: vkModule.default.vk_beta_2[0],
        vk_gamma_2: vkModule.default.vk_gamma_2[0],
        vk_delta_2: vkModule.default.vk_delta_2[0],
        IC: vkModule.default.IC
      };

      // Send proof to zkVerify
      console.log('\n=== SENDING PROOF TO ZKVERIFY ===');
      await onVerifyProof(proofResult.proof, proofResult.publicSignals, vk);

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