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
  weather: string;
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
    weather: string;
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
    lemons: 0.05,
    sugar: 0.03,
    ice: 0.02
  };
  private readonly ADVERTISING_OPTIONS = {
    none: { cost: 0, multiplier: 0.8 },     // 20% penalty for no advertising
    flyers: { cost: 3, multiplier: 1.2 },    // +20% customers for $3
    social: { cost: 8, multiplier: 1.8 },    // +80% customers for $8
    radio: { cost: 15, multiplier: 2.5 }     // +150% customers for $15
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
      money: 20.00,
      inventory: {
        lemons: 0,
        sugar: 0,
        ice: 0
      },
      prices: {
        lemonade: 1.00
      },
      weather: 'sunny',
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
    console.log('Starting Money:', 20.00);
    console.log('Starting Inventory:', {
      lemons: 0,
      sugar: 0,
      ice: 0
    });
    console.log('Starting Price:', 1.00);
    console.log('Starting Weather:', 'sunny');
    console.log('Starting Advertising:', 'none');
    console.log('================================\n');
  }

  public resetGame(): void {
    this.state = {
      day: 1,
      money: 20.00,
      inventory: {
        lemons: 0,
        sugar: 0,
        ice: 0
      },
      prices: {
        lemonade: 1.00
      },
      weather: 'sunny',
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
    console.log('Starting Money:', 20.00);
    console.log('Starting Inventory:', {
      lemons: 0,
      sugar: 0,
      ice: 0
    });
    console.log('Starting Price:', 1.00);
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
    // Score should be in dollars
    return this.state.money;
  }

  private checkGameOver(): void {
    if (this.state.day > this.MAX_DAYS) {
      this.state.gameOver = true;
      // You "win" if you made more than your starting money (2000 cents)
      this.state.won = this.state.money > 20.00;
      this.state.finalScore = this.calculateFinalScore();
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
    if (!this.validatePrice(price)) return false;
    this.state.prices.lemonade = Number(price.toFixed(2));
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
    customersServed: number;
    gameOver: boolean;
    won: boolean;
    finalScore: number | null;
    advertisingCost: number;
    iceUsed: number;
    iceMelted: number;
    lemonsUsed: number;
    sugarUsed: number;
  } {
    console.log('\n🔔🔔🔔 LEMONADE STAND DAY ' + this.state.day + ' STARTING 🔔🔔🔔');
    console.log('Current Inventory:', { ...this.state.inventory });
    console.log('Current Money:', this.state.money);
    console.log('Current Price:', this.state.prices.lemonade);
    console.log('Current Weather:', this.state.weather);
    console.log('Current Advertising:', this.state.advertising.type);
    console.log('================================\n');

    if (this.state.gameOver) {
      return {
        sales: 0,
        revenue: 0,
        weather: this.state.weather,
        customersServed: 0,
        gameOver: true,
        won: this.state.won,
        finalScore: this.state.finalScore,
        advertisingCost: 0,
        iceUsed: 0,
        iceMelted: 0,
        lemonsUsed: 0,
        sugarUsed: 0
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

    // Generate weather for the day
    if (this.state.day === 1) {
      this.state.weather = 'sunny';  // First day must be sunny
    } else {
      this.state.weather = this.generateWeather();
    }

    // Calculate number of customers
    const baseCustomers = this.calculateCustomers(this.state.weather);
    const advertisingMultiplier = this.state.advertising.multiplier;
    const priceMultiplier = this.getPriceMultiplier();
    const totalCustomers = Math.floor(baseCustomers * advertisingMultiplier * priceMultiplier);

    console.log('\n=== CUSTOMER CALCULATION ===');
    console.log('Base Customers:', baseCustomers, `(${this.state.weather} weather)`);
    console.log('Price:', this.state.prices.lemonade, '-> multiplier:', priceMultiplier);
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

    // Calculate revenue and update money
    const revenue = actualSales * this.state.prices.lemonade;
    this.state.money += revenue;

    // Calculate ingredients used
    const lemonsUsed = actualSales * lemonsPerCup;
    const sugarUsed = actualSales * sugarPerCup;
    const iceUsed = actualSales * icePerCup;
    
    // Update inventory - first use ingredients for drinks
    this.state.inventory.lemons -= lemonsUsed;
    this.state.inventory.sugar -= sugarUsed;
    this.state.inventory.ice -= iceUsed;

    // All remaining ice melts at end of day
    const iceMelted = this.state.inventory.ice;
    const totalIceUsed = iceUsed + iceMelted;
    this.state.inventory.ice = 0; // All ice is gone at end of day

    // Convert weather to number (for circuit)
    const weatherMap: { [key: string]: number } = {
      'rainy': 0,    // Circuit: 0=rainy
      'cloudy': 1,   // Circuit: 1=cloudy
      'sunny': 2,    // Circuit: 2=sunny
      'hot': 3       // Circuit: 3=hot
    };

    // Convert advertising to number (for circuit)
    const advertisingMap: { [key: string]: number } = {
      'none': 0,
      'flyers': 1,
      'social': 2,
      'radio': 3
    };

    console.log('\n=== PROOF DATA FOR DAY ' + this.state.day + ' ===');
    console.log('1. Daily State:', [
      Math.floor(this.state.money * 100),  // Current total money in cents
      this.state.inventory.lemons,         // Current lemons in inventory
      this.state.inventory.sugar,          // Current sugar in inventory
      this.state.inventory.ice             // Current ice in inventory (will be 0 at end of day)
    ]);
    console.log('2. Daily Recipe:', [
      lemonsPerCup,  // lemons per cup
      sugarPerCup,   // sugar per cup
      icePerCup      // ice per cup
    ]);
    console.log('3. Daily Price:', Math.floor(this.state.prices.lemonade * 100), '(in cents)');
    console.log('4. Daily Weather:', weatherMap[this.state.weather], `(${this.state.weather})`);
    console.log('5. Daily Advertising:', advertisingMap[this.state.advertising.type], `(${this.state.advertising.type})`);
    
    console.log('\nInventory Details:');
    console.log('  Lemons:', this.state.inventory.lemons);
    console.log('  Sugar:', this.state.inventory.sugar);
    console.log('  Ice:', this.state.inventory.ice, '(all ice melts at end of day)');
    console.log('  Ice Used In Drinks:', iceUsed);
    console.log('  Ice Melted At End Of Day:', iceMelted);
    console.log('  Total Ice Lost:', totalIceUsed);
    console.log('================================\n');

    // Add to sales history
    this.state.salesHistory.push({
      day: this.state.day,
      sales: actualSales,
      revenue,
      weather: this.state.weather,
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

    // Increment day
    this.state.day++;
    this.checkGameOver();

    return {
      sales: actualSales,
      revenue,
      weather: this.state.weather,
      customersServed: totalCustomers,
      gameOver: this.state.gameOver,
      won: this.state.won,
      finalScore: this.state.finalScore,
      advertisingCost: this.state.advertising.cost,
      iceUsed,
      iceMelted,
      lemonsUsed,
      sugarUsed
    };
  }

  private calculateCustomers(weather: string): number {
    // Base customers now vary more by weather
    let baseCustomers: number;
    switch(weather) {
      case 'hot':
        baseCustomers = Math.floor(Math.random() * 20) + 30;    // 30-50
        break;
      case 'sunny':
        baseCustomers = Math.floor(Math.random() * 20) + 20;    // 20-40
        break;
      case 'cloudy':
        baseCustomers = Math.floor(Math.random() * 20) + 10;    // 10-30
        break;
      case 'rainy':
        baseCustomers = Math.floor(Math.random() * 10) + 5;     // 5-15
        break;
      default:
        baseCustomers = Math.floor(Math.random() * 20) + 10;    // fallback 10-30
    }
    
    const priceMultiplier = this.getPriceMultiplier();
    const advertisingMultiplier = this.state.advertising.multiplier;
    
    // Apply both price and advertising multipliers
    return Math.floor(baseCustomers * priceMultiplier * advertisingMultiplier);
  }

  private getPriceMultiplier(): number {
    // More dynamic price sensitivity
    const price = this.state.prices.lemonade;
    if (price <= 0.25) return 3.0;           // Triple customers at very low prices
    if (price <= 0.50) return 2.0;           // Double customers at low prices
    if (price <= 0.75) return 1.5;           // 50% more customers at moderate prices
    if (price <= 1.00) return 1.0;           // Base rate at standard price
    if (price <= 1.25) return 0.75;          // 25% fewer customers
    if (price <= 1.50) return 0.5;           // Half customers
    return 0.25;                             // Very few customers at high prices
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

  private validatePrice(price: number): boolean {
    // Convert to cents for validation
    const priceInCents = Math.floor(price * 100);
    if (priceInCents <= 0) {
      console.error('Invalid price: Must be greater than 0');
      return false;
    }
    return true;
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
} 