export type AdvertisingType = 'none' | 'flyers' | 'social' | 'radio';

export interface GameState {
  money: number;
  inventory: {
    lemons: number;
    sugar: number;
    ice: number;
  };
  advertising: {
    type: AdvertisingType;
    cost: number;
    multiplier: number;
  };
}

export interface DayResult {
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
} 