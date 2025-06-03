interface SimulationResult {
  customers: number;
  revenue: number;
  expenses: number;
  adCost: number;
  profit: number;
  weather: string;
}

interface Advertising {
  type: 'none' | 'flyers' | 'social' | 'radio';
  cost: number;
  multiplier: number;
}

export class GameState {
  private money: number = 500;  // Start with $50 (500 units)
  private price: number = 3.00;  // Default price is $3.00
  private weather: string = 'sunny';
  private advertising: Advertising = {
    type: 'none',
    cost: 0,
    multiplier: 0.8  // -20% customers with no advertising
  };

  getWeatherMultiplier(): number {
    switch (this.weather) {
      case 'sunny': return 1.2;
      case 'cloudy': return 1.0;
      case 'rainy': return 0.7;
      default: return 1.0;
    }
  }

  calculateCustomerMultiplier(price: number): number {
    const priceInUnits = price * 10;  // Convert to 10-cent units
    
    // Price ranges from 5 units ($0.50) to 60 units ($6.00)
    if (priceInUnits <= 10) return 3.0;           // $0.50-$1.00: highest demand
    if (priceInUnits <= 20) return 2.0;           // $1.01-$2.00
    if (priceInUnits <= 30) return 1.0;           // $2.01-$3.00
    if (priceInUnits <= 40) return 0.8;           // $3.01-$4.00
    if (priceInUnits <= 50) return 0.6;           // $4.01-$5.00
    return 0.4;                                    // $5.01-$6.00: lowest demand
  }

  calculateProfit(customers: number, price: number): number {
    const priceInUnits = price * 10;  // Convert to 10-cent units
    const costPerCup = (
      2 * 5 +  // 2 lemons at $0.50 each = 5 units
      1 * 3 +  // 1 sugar at $0.30 each = 3 units
      3 * 2    // 3 ice at $0.20 each = 2 units
    );  // Total cost per cup = 13 units ($1.30)
    
    return customers * (priceInUnits - costPerCup);  // Return profit in units
  }

  simulateDay(): SimulationResult {
    const baseCustomers = 100;
    const weatherMultiplier = this.getWeatherMultiplier();
    const priceMultiplier = this.calculateCustomerMultiplier(this.price);
    const adMultiplier = this.advertising.multiplier;
    
    const totalCustomers = Math.floor(
      baseCustomers * weatherMultiplier * priceMultiplier * adMultiplier
    );
    
    const profit = this.calculateProfit(totalCustomers, this.price);
    const revenue = totalCustomers * (this.price * 10);  // Convert price to units
    const expenses = totalCustomers * 13;  // 13 units per cup cost
    const adCost = this.advertising.cost;  // Already in units
    
    this.money += profit - adCost;
    
    return {
      customers: totalCustomers,
      revenue: revenue,
      expenses: expenses,
      adCost: adCost,
      profit: profit - adCost,
      weather: this.weather
    };
  }

  // Getters and setters
  getMoney(): number {
    return this.money;
  }

  getPrice(): number {
    return this.price;
  }

  setPrice(price: number): void {
    this.price = price;
  }

  getAdvertising(): Advertising {
    return this.advertising;
  }

  setAdvertising(type: 'none' | 'flyers' | 'social' | 'radio'): void {
    switch (type) {
      case 'none':
        this.advertising = { type, cost: 0, multiplier: 0.8 };
        break;
      case 'flyers':
        this.advertising = { type, cost: 30, multiplier: 1.2 };  // $3.00 = 30 units
        break;
      case 'social':
        this.advertising = { type, cost: 80, multiplier: 1.8 };  // $8.00 = 80 units
        break;
      case 'radio':
        this.advertising = { type, cost: 150, multiplier: 2.5 }; // $15.00 = 150 units
        break;
    }
  }
} 