interface GameState {
  day: number;
  money: number;
  inventory: {
    lemons: number;
    sugar: number;
    ice: number;
  };
  prices: {
    lemonade: number;
  };
  weather: string;  // Only used for current day's weather
  customers: number;
  advertising: {
    type: 'none' | 'flyers' | 'social' | 'radio';
    cost: number;
    multiplier: number;
  };
  salesHistory: {
    day: number;
    sales: number;
    revenue: number;
    weather: string;  // Weather that affected this day's sales
    advertisingCost: number;
    iceUsed: number;
    iceMelted: number;
    lemonsUsed: number;
    sugarUsed: number;
    recipe: {
      lemonsPerCup: number;
      sugarPerCup: number;
      icePerCup: number;
    };
    price: number;
    advertising: 'none' | 'flyers' | 'social' | 'radio';
  }[];
  gameOver: boolean;
  won: boolean;
  finalScore: number | null;
}

export class LemonadeStand {
  private state: GameState;
  private readonly WEATHER_TYPES = ['rainy', 'cloudy', 'sunny', 'hot'];
  private readonly PRICES = {
    lemons: 5,  // $0.50 in 10-cent units
    sugar: 3,   // $0.30 in 10-cent units
    ice: 2      // $0.20 in 10-cent units
  };
  private readonly ADVERTISING_OPTIONS = {
    none: { cost: 0, multiplier: 0.8 },     // 20% penalty for no advertising
    flyers: { cost: 90, multiplier: 1.2 },   // +20% customers for $9.00 (was $3.00)
    social: { cost: 240, multiplier: 1.8 },  // +80% customers for $24.00 (was $8.00)
    radio: { cost: 450, multiplier: 2.5 }    // +150% customers for $45.00 (was $15.00)
  };
  private readonly MAX_DAYS = 7;
  // Fixed recipe values
  private readonly RECIPE = {
    lemonsPerCup: 2,
    sugarPerCup: 1,
    icePerCup: 3
  };

  constructor() {
    this.state = {
      day: 1,
      money: 1200,  // $120.00 in 10-cent units
      inventory: {
        lemons: 0,
        sugar: 0,
        ice: 0
      },
      prices: {
        lemonade: 30  // $3.00 in 10-cent units
      },
      weather: 'sunny',  // First day starts with sunny weather
      customers: 0,
      advertising: {
        type: 'none',
        ...this.ADVERTISING_OPTIONS.none
      },
      salesHistory: [],
      gameOver: false,
      won: false,
      finalScore: null
    };

    // Log initial state
    console.log('\n=== INITIAL STATE ===');
    console.log('Starting Money:', this.convertToDollars(1200).toFixed(2));
    console.log('Starting Inventory:', {
      lemons: 0,
      sugar: 0,
      ice: 0
    });
    console.log('Starting Price:', this.convertToDollars(30).toFixed(2));  // Show in dollars
    console.log('Starting Weather:', 'sunny');
    console.log('Starting Advertising:', 'none');
    console.log('================================\n');
  }

  public resetGame(): void {
    this.state = {
      day: 1,
      money: 1200,  // $120.00 in 10-cent units
      inventory: {
        lemons: 0,
        sugar: 0,
        ice: 0
      },
      prices: {
        lemonade: 30  // $3.00 in 10-cent units
      },
      weather: 'sunny',  // Reset to sunny
      customers: 0,
      advertising: {
        type: 'none',
        ...this.ADVERTISING_OPTIONS.none
      },
      salesHistory: [],
      gameOver: false,
      won: false,
      finalScore: null
    };

    // Log initial state after reset
    console.log('\n=== INITIAL STATE (AFTER RESET) ===');
    console.log('Starting Money:', this.convertToDollars(1200).toFixed(2));
    console.log('Starting Inventory:', {
      lemons: 0,
      sugar: 0,
      ice: 0
    });
    console.log('Starting Price:', this.convertToDollars(30).toFixed(2));  // Show in dollars
    console.log('Starting Weather:', 'sunny');
    console.log('Starting Advertising:', 'none');
    console.log('================================\n');
  }

  private generateWeather(): string {
    // Generate random weather for non-first days
    return this.WEATHER_TYPES[Math.floor(Math.random() * this.WEATHER_TYPES.length)];
  }

  public getState(): GameState {
    return { ...this.state };
  }

  private calculateFinalScore(): number {
    // Return money in 10-cent units to match the circuit's expectations
    return this.state.money;
  }

  private checkGameOver(): void {
    if (this.state.day > this.MAX_DAYS) {
      // Calculate final score before setting game over
      const finalScore = this.calculateFinalScore();
      
      // Set game over state after showing day 7's details
      this.state.gameOver = true;
      this.state.won = this.state.money > 1200;
      this.state.finalScore = finalScore;
    }
  }

  public buyIngredients(item: 'lemons' | 'sugar' | 'ice', quantity: number): boolean {
    if (this.state.gameOver) return false;
    
    const cost = this.PRICES[item] * quantity;
    if (cost > this.state.money) {
      return false;
    }

    this.state.money -= cost;
    this.state.inventory[item] += quantity;
    return true;
  }

  public setLemonadePrice(price: number): boolean {
    if (this.state.gameOver) return false;
    
    // Convert UI dollar input to 10-cent units
    const priceIn10CentUnits = Math.round(price * 10);
    
    // Validate the price in 10-cent units
    if (!this.validatePrice(priceIn10CentUnits)) {
      return false;
    }
    
    // Store in 10-cent units directly
    this.state.prices.lemonade = priceIn10CentUnits;
    
    console.log('Setting price to:', this.convertToDollars(priceIn10CentUnits).toFixed(2), 'dollars =', priceIn10CentUnits, 'in 10-cent units');
    return true;
  }

  private validatePrice(priceIn10CentUnits: number): boolean {
    // Validate price is in valid range (5-60 units)
    if (priceIn10CentUnits < 5 || priceIn10CentUnits > 60) {
      console.error('Invalid price: Must be between 5 and 60 ten-cent units ($0.50-$6.00)');
      return false;
    }
    
    return true;
  }

  public setAdvertising(type: 'none' | 'flyers' | 'social' | 'radio'): boolean {
    if (this.state.gameOver) return false;
    
    // If it's the same type, don't do anything
    if (type === this.state.advertising.type) {
      return true;
    }
    
    const option = this.ADVERTISING_OPTIONS[type];
    
    // Check if player can afford the advertising type
    if (type !== 'none' && option.cost > this.state.money) {
      return false;
    }
    
    // Update the advertising type
    this.state.advertising = {
      type,
      ...option
    };
    return true;
  }

  public simulateDay(): {
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
  } {
    console.log('\n🔔🔔🔔 LEMONADE STAND DAY ' + this.state.day + ' STARTING 🔔🔔🔔');
    console.log('Current Inventory:', { ...this.state.inventory });
    console.log('Current Money:', this.convertToDollars(this.state.money).toFixed(2));
    console.log('Current Price:', '$' + this.convertToDollars(this.state.prices.lemonade).toFixed(2));
    
    // Get the previous day's data from sales history
    const previousDayData = this.state.salesHistory[this.state.salesHistory.length - 1];
    if (previousDayData) {
      console.log('Yesterday\'s Weather:', previousDayData.weather);
    } else {
      console.log('Yesterday\'s Weather:', this.state.weather);
    }
    console.log('Today\'s Weather:', this.state.weather);
    console.log('Current Advertising:', this.state.advertising.type);
    console.log('================================\n');

    // Only return early if we're already in game over state
    if (this.state.gameOver) {
      return {
        sales: 0,
        revenue: 0,
        weather: this.state.weather,
        yesterdayWeather: this.state.weather,
        customersServed: 0,
        gameOver: true,
        won: this.state.won,
        finalScore: this.state.finalScore,
        advertisingCost: 0,
        iceUsed: 0,
        iceMelted: 0,
        lemonsUsed: 0,
        sugarUsed: 0,
        financialDetails: {
          revenue: 0,
          costs: {
            total: 0,
            ingredients: {
              total: 0,
              lemons: 0,
              sugar: 0,
              ice: 0
            },
            advertising: 0
          },
          profit: 0
        }
      };
    }

    const advertisingCost = this.state.advertising.cost;

    // Check if we can afford advertising
    if (advertisingCost > this.state.money) {
      // If we can't afford advertising, switch to no advertising
      this.state.advertising = {
        type: 'none',
        ...this.ADVERTISING_OPTIONS.none
      };
    }

    // Deduct advertising cost
    this.state.money -= this.state.advertising.cost;

    // Calculate number of customers using today's weather
    const baseCustomers = this.calculateCustomers(this.state.weather);
    const advertisingMultiplier = this.state.advertising.multiplier;
    const priceMultiplier = this.getPriceMultiplier();
    const totalCustomers = Math.floor(baseCustomers * advertisingMultiplier * priceMultiplier);

    console.log('\n=== CUSTOMER CALCULATION ===');
    console.log('Base Customers:', baseCustomers, `(${this.state.weather} weather for today)`);
    console.log('Price:', '$' + this.convertToDollars(this.state.prices.lemonade).toFixed(2), '-> multiplier:', priceMultiplier);
    console.log('Advertising:', this.state.advertising.type, '-> multiplier:', advertisingMultiplier);
    console.log('Total Potential Customers:', totalCustomers);

    // Fixed recipe values - these are part of the game design
    const lemonsPerCup = 2;  // Always 2 lemons per cup
    const sugarPerCup = 1;   // Always 1 sugar per cup
    const icePerCup = 3;     // Always 3 ice per cup

    const maxCupsFromLemons = Math.floor(this.state.inventory.lemons / lemonsPerCup);
    const maxCupsFromSugar = Math.floor(this.state.inventory.sugar / sugarPerCup);
    const maxCupsFromIce = Math.floor(this.state.inventory.ice / icePerCup);

    const maxPossibleCups = Math.min(maxCupsFromLemons, maxCupsFromSugar, maxCupsFromIce);
    const actualSales = Math.min(totalCustomers, maxPossibleCups);

    console.log('\n=== INVENTORY CONSTRAINTS ===');
    console.log('Max cups from lemons:', maxCupsFromLemons, `(${this.state.inventory.lemons} lemons / ${lemonsPerCup} per cup)`);
    console.log('Max cups from sugar:', maxCupsFromSugar, `(${this.state.inventory.sugar} sugar / ${sugarPerCup} per cup)`);
    console.log('Max cups from ice:', maxCupsFromIce, `(${this.state.inventory.ice} ice / ${icePerCup} per cup)`);
    console.log('Max possible cups:', maxPossibleCups);
    console.log('Actual sales:', actualSales, '(limited by inventory or customers)');

    // Calculate ingredients used
    const lemonsUsed = actualSales * lemonsPerCup;
    const sugarUsed = actualSales * sugarPerCup;
    const iceUsed = actualSales * icePerCup;
    
    // Calculate revenue and costs
    const revenue = actualSales * this.state.prices.lemonade;  // Both in 10-cent units
    
    // Calculate costs for the day
    const ingredientCosts = {
      lemons: lemonsUsed * this.PRICES.lemons,
      sugar: sugarUsed * this.PRICES.sugar,
      ice: iceUsed * this.PRICES.ice
    };
    const totalIngredientCost = ingredientCosts.lemons + ingredientCosts.sugar + ingredientCosts.ice;
    const totalCosts = totalIngredientCost + this.state.advertising.cost;
    const profit = revenue - totalCosts;

    this.state.money += revenue;

    console.log('\n=== DAILY FINANCIAL SUMMARY ===');
    console.log('Revenue:', this.convertToDollars(revenue).toFixed(2), '($' + this.convertToDollars(this.state.prices.lemonade).toFixed(2) + ' × ' + actualSales + ' cups)');
    console.log('Costs:', this.convertToDollars(totalCosts).toFixed(2));
    console.log('  - Ingredients:', this.convertToDollars(totalIngredientCost).toFixed(2));
    console.log('    * Lemons:', this.convertToDollars(ingredientCosts.lemons).toFixed(2), '($' + this.convertToDollars(this.PRICES.lemons).toFixed(2) + ' × ' + lemonsUsed + ' lemons)');
    console.log('    * Sugar:', this.convertToDollars(ingredientCosts.sugar).toFixed(2), '($' + this.convertToDollars(this.PRICES.sugar).toFixed(2) + ' × ' + sugarUsed + ' sugar)');
    console.log('    * Ice:', this.convertToDollars(ingredientCosts.ice).toFixed(2), '($' + this.convertToDollars(this.PRICES.ice).toFixed(2) + ' × ' + iceUsed + ' ice)');
    console.log('  - Advertising:', this.convertToDollars(this.state.advertising.cost).toFixed(2));
    console.log('Profit:', this.convertToDollars(profit).toFixed(2));
    console.log('================================\n');

    // Update inventory - first use ingredients for drinks
    this.state.inventory.lemons -= lemonsUsed;
    this.state.inventory.sugar -= sugarUsed;
    this.state.inventory.ice -= iceUsed;

    // All remaining ice melts at end of day
    const iceMelted = this.state.inventory.ice;
    const totalIceUsed = iceUsed + iceMelted;
    this.state.inventory.ice = 0; // All ice is gone at end of day

    // Add to sales history with today's weather
    this.state.salesHistory.push({
      day: this.state.day,
      sales: actualSales,
      revenue,
      weather: this.state.weather,  // Today's weather that affected sales
      advertisingCost: this.state.advertising.cost,
      iceUsed,
      iceMelted,
      lemonsUsed,
      sugarUsed,
      recipe: {
        lemonsPerCup,
        sugarPerCup,
        icePerCup
      },
      price: this.state.prices.lemonade,
      advertising: this.state.advertising.type
    });

    // Increment day before checking game over
    this.state.day++;

    // Get yesterday's data from sales history
    const yesterdayData = this.state.salesHistory[this.state.salesHistory.length - 1];

    // Generate new weather for tomorrow
    if (this.state.day === 1) {
      this.state.weather = 'sunny';  // Second day starts sunny
    } else {
      this.state.weather = this.generateWeather();
    }

    // For the first day, use current day's data since there is no yesterday
    const resultData = !yesterdayData ? {
      sales: actualSales,
      revenue,
      weather: this.state.weather,  // Today's weather
      yesterdayWeather: this.state.weather,  // Yesterday's weather (same as today for first day)
      customersServed: totalCustomers,
      advertisingCost: this.state.advertising.cost,
      iceUsed,
      iceMelted,
      lemonsUsed,
      sugarUsed,
      financialDetails: {
        revenue,
        costs: {
          total: totalCosts,
          ingredients: {
            total: totalIngredientCost,
            lemons: ingredientCosts.lemons,
            sugar: ingredientCosts.sugar,
            ice: ingredientCosts.ice
          },
          advertising: this.state.advertising.cost
        },
        profit
      }
    } : {
      // Use today's data instead of yesterday's
      sales: actualSales,
      revenue,
      weather: this.state.weather,  // Today's weather
      yesterdayWeather: yesterdayData.weather,  // Yesterday's weather from sales history
      customersServed: totalCustomers,  // Use actual customers for today
      advertisingCost: this.state.advertising.cost,
      iceUsed,
      iceMelted,
      lemonsUsed,
      sugarUsed,
      financialDetails: {
        revenue,
        costs: {
          total: totalCosts,
          ingredients: {
            total: totalIngredientCost,
            lemons: ingredientCosts.lemons,
            sugar: ingredientCosts.sugar,
            ice: ingredientCosts.ice
          },
          advertising: this.state.advertising.cost
        },
        profit
      }
    };

    // Prepare return value before checking game over
    const result: {
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
    } = {
      ...resultData,
      gameOver: false,
      won: false,
      finalScore: null
    };

    // Now check game over - this will update the state if it's the end
    this.checkGameOver();

    // Update the result with final game state if game is over
    if (this.state.gameOver) {
      result.gameOver = true;
      result.won = this.state.won;
      result.finalScore = this.state.finalScore;
    }

    return result;
  }

  private calculateCustomers(weather: string): number {
    // Base customers vary by weather
    let baseCustomers: number;
    switch(weather) {
      case 'hot':
        baseCustomers = Math.floor(Math.random() * 20) + 80;    // 80-100 customers on hot days
        break;
      case 'sunny':
        baseCustomers = Math.floor(Math.random() * 20) + 60;    // 60-80 customers on sunny days
        break;
      case 'cloudy':
        baseCustomers = Math.floor(Math.random() * 20) + 40;    // 40-60 customers on cloudy days
        break;
      case 'rainy':
        baseCustomers = Math.floor(Math.random() * 20) + 20;    // 20-40 customers on rainy days
        break;
      default:
        baseCustomers = Math.floor(Math.random() * 20) + 40;    // fallback 40-60 customers
    }
    
    return baseCustomers; // Return base customers - multipliers are applied in simulateDay
  }

  private getPriceMultiplier(): number {
    // Price is already in 10-cent units (5-60 units)
    const price = this.state.prices.lemonade;
    if (price <= 15) return 3.0;           // 5-15 units ($0.50-$1.50): highest demand
    if (price <= 24) return 2.0;           // 16-24 units ($1.60-$2.40): high demand
    if (price >= 25 && price <= 34) return 1.0;  // 25-34 units ($2.50-$3.40): normal demand
    if (price <= 44) return 0.8;           // 35-44 units ($3.50-$4.40): low demand
    if (price <= 54) return 0.6;           // 45-54 units ($4.50-$5.40): very low demand
    return 0.4;                            // 55-60 units ($5.50-$6.00): lowest demand
  }

  public getGameSummary(): {
    totalDays: number;
    totalRevenue: number;
    totalCustomers: number;
    averageRevenuePerDay: number;
    gameOver: boolean;
    won: boolean;
    finalScore: number | null;
  } {
    const totalRevenue = this.state.salesHistory.reduce((sum, day) => sum + day.revenue, 0);
    const totalCustomers = this.state.salesHistory.reduce((sum, day) => sum + day.sales, 0);

    return {
      totalDays: this.state.day - 1,
      totalRevenue: totalRevenue,
      totalCustomers: totalCustomers,
      averageRevenuePerDay: totalRevenue / (this.state.day - 1),
      gameOver: this.state.gameOver,
      won: this.state.won,
      finalScore: this.state.finalScore
    };
  }

  private getWeatherValue(weather: string): number {
    // Circuit expects: 0=rainy, 1=cloudy, 2=sunny, 3=hot
    const weatherMap: { [key: string]: number } = {
      'rainy': 0,
      'cloudy': 1,
      'sunny': 2,
      'hot': 3
    };
    return weatherMap[weather] ?? 0;
  }

  private getAdvertisingValue(type: string): number {
    // Circuit expects: 0=none, 1=flyers, 2=social, 3=radio
    const adMap: { [key: string]: number } = {
      'none': 0,
      'flyers': 1,
      'social': 2,
      'radio': 3
    };
    return adMap[type] ?? 0;
  }

  // Helper method to convert 10-cent units to dollars for display
  private convertToDollars(amount: number): number {
    return amount / 10;
  }

  // Helper method to get display prices
  public getDisplayPrices(): { lemons: number; sugar: number; ice: number } {
    return {
      lemons: this.convertToDollars(this.PRICES.lemons),
      sugar: this.convertToDollars(this.PRICES.sugar),
      ice: this.convertToDollars(this.PRICES.ice)
    };
  }
} 