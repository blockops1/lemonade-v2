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
  }[];
  gameOver: boolean;
  won: boolean;
  finalScore: number | null;
}

export class LemonadeStand {
  private state: GameState;
  private readonly WEATHER_TYPES = ['Sunny', 'Hot', 'Cloudy', 'Rainy'];
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
      weather: this.generateWeather(), // Generate initial forecast
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
  }

  private generateWeather(): string {
    return this.WEATHER_TYPES[Math.floor(Math.random() * this.WEATHER_TYPES.length)];
  }

  public getState(): GameState {
    return { ...this.state };
  }

  private calculateFinalScore(): number {
    // Score is simply the final amount of money
    return Math.round(this.state.money * 100) / 100;
  }

  private checkGameOver(): void {
    if (this.state.day > this.MAX_DAYS) {
      this.state.gameOver = true;
      // You "win" if you made more than your starting money
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

  public setLemonadePrice(price: number): void {
    if (this.state.gameOver) return;
    if (price < 0.01) return;
    this.state.prices.lemonade = Number(price.toFixed(2));
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

    // Check if we have enough ingredients
    const possibleLemonades = Math.floor(Math.min(
      this.state.inventory.lemons / 2,
      this.state.inventory.sugar / 1,
      this.state.inventory.ice / 3
    ));

    if (possibleLemonades < 1) {
      return {
        sales: 0,
        revenue: 0,
        weather: this.state.weather,
        customersServed: 0,
        gameOver: false,
        won: false,
        finalScore: null,
        advertisingCost: 0, // Don't charge if we can't make sales
        iceUsed: 0,
        iceMelted: this.state.inventory.ice,
        lemonsUsed: 0,
        sugarUsed: 0
      };
    }

    // Use current weather for the day's simulation
    const todaysWeather = this.state.weather;
    // Generate next day's forecast
    this.state.weather = this.generateWeather();
    
    // Calculate potential customers using today's weather
    this.state.customers = this.calculateCustomers(todaysWeather);
    
    // Calculate actual sales (limited by inventory)
    const actualSales = Math.min(possibleLemonades, this.state.customers);
    const revenue = actualSales * this.state.prices.lemonade;

    // Calculate ingredient usage
    const lemonsUsed = actualSales * 2;
    const sugarUsed = actualSales * 1;
    const iceUsed = actualSales * 3;
    
    // Update inventory and money
    this.state.inventory.lemons -= lemonsUsed;
    this.state.inventory.sugar -= sugarUsed;
    this.state.inventory.ice -= iceUsed;
    this.state.money += revenue;

    // Apply advertising cost only if we made sales
    if (actualSales > 0) {
      this.state.money -= advertisingCost;
    }

    // Check if bankrupt after all transactions
    if (this.state.money < 0) {
      this.state.gameOver = true;
      this.state.won = false;
      this.state.finalScore = this.calculateFinalScore();
      return {
        sales: actualSales,
        revenue,
        weather: todaysWeather,
        customersServed: actualSales,
        gameOver: true,
        won: false,
        finalScore: this.state.finalScore,
        advertisingCost: actualSales > 0 ? advertisingCost : 0,
        iceUsed,
        iceMelted: 0,
        lemonsUsed,
        sugarUsed
      };
    }

    // Remaining ice melts at the end of the day
    const iceMelted = this.state.inventory.ice;
    this.state.inventory.ice = 0;

    // Record sales history
    const dayResults = {
      sales: actualSales,
      revenue,
      weather: todaysWeather,
      customersServed: actualSales,
      advertisingCost: actualSales > 0 ? advertisingCost : 0,
      iceUsed,
      iceMelted,
      lemonsUsed,
      sugarUsed
    };

    this.state.salesHistory.push({
      day: this.state.day,
      ...dayResults
    });

    this.state.day += 1;
    
    // Check win/lose conditions
    this.checkGameOver();

    return {
      ...dayResults,
      gameOver: this.state.gameOver,
      won: this.state.won,
      finalScore: this.state.finalScore
    };
  }

  private calculateCustomers(weather: string): number {
    // Base customers now vary more by weather
    let baseCustomers: number;
    switch(weather) {
      case 'Hot':
        baseCustomers = Math.floor(Math.random() * 20) + 30;    // 30-50
        break;
      case 'Sunny':
        baseCustomers = Math.floor(Math.random() * 20) + 20;    // 20-40
        break;
      case 'Cloudy':
        baseCustomers = Math.floor(Math.random() * 20) + 10;    // 10-30
        break;
      case 'Rainy':
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
} 