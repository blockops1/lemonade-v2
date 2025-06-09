export const testGameData = {
    dailyStates: [
        [120, 10, 5, 20],  // Day 1: money, lemons, sugar, ice
        [150, 8, 3, 15],   // Day 2
        [180, 6, 2, 10],   // Day 3
        [200, 4, 1, 8],    // Day 4
        [220, 2, 0, 5],    // Day 5
        [240, 1, 0, 2],    // Day 6
        [250, 0, 0, 0]     // Day 7
    ],
    dailyRecipes: [
        [2, 1, 3],  // Day 1: lemonsPerCup, sugarPerCup, icePerCup
        [2, 1, 3],  // Day 2
        [2, 1, 3],  // Day 3
        [2, 1, 3],  // Day 4
        [2, 1, 3],  // Day 5
        [2, 1, 3],  // Day 6
        [2, 1, 3]   // Day 7
    ],
    dailyPrices: [3, 3, 3, 3, 3, 3, 3],  // Price per cup each day
    dailyWeather: [1, 1, 1, 1, 1, 1, 1],  // 1 = sunny
    dailyAdvertising: [0, 0, 0, 0, 0, 0, 0],  // 0 = none
    finalScore: 250,
    startingMoney: 120
}; 