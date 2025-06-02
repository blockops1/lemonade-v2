pragma circom 2.2.2;

include "circomlib/poseidon.circom";
include "circomlib/comparators.circom";

/*
 * Main circuit for verifying lemonade stand game state
 * Public inputs:
 * - finalScore: final game score
 * - daysPlayed: number of days played
 * - startingMoney: initial money
 * - gameStateHash: hash of all daily states
 * Private inputs:
 * - dailyStates: array of daily game states
 * - dailyRecipes: array of recipe configurations
 * - dailyPrices: array of prices set
 * - dailyWeather: array of weather conditions
 * - dailyAdvertising: array of advertising levels
 * Outputs:
 * - isValid: whether the game state is valid
 * - verifiedScore: verified final score
 */
template LemonadeGame(maxDays) {
    // Public inputs
    signal input finalScore;
    signal input daysPlayed;
    signal input startingMoney;
    signal input gameStateHash;
    
    // Private inputs (arrays of length maxDays)
    signal input dailyStates[maxDays][4]; // [money, lemons, sugar, ice]
    signal input dailyRecipes[maxDays][3]; // [lemonsPerCup, sugarPerCup, icePerCup]
    signal input dailyPrices[maxDays];
    signal input dailyWeather[maxDays];
    signal input dailyAdvertising[maxDays];
    
    // Intermediate signals
    signal dailyValid[maxDays];
    signal dailyRevenue[maxDays];
    signal runningScore;
    signal stateHashValid;
    
    // Initialize Poseidon for state hashing
    component stateHasher = Poseidon(maxDays * 4); // 4 values per day
    
    // Verify each day's state
    for (var i = 0; i < maxDays; i++) {
        // Verify recipe ratios
        component validLemons = GreaterEqThan(8);
        validLemons.in[0] <== dailyRecipes[i][0];
        validLemons.in[1] <== 2; // Minimum 2 lemons per cup
        
        component validSugar = GreaterEqThan(8);
        validSugar.in[0] <== dailyRecipes[i][1];
        validSugar.in[1] <== 1; // Minimum 1 sugar per cup
        
        component validIce = GreaterEqThan(8);
        validIce.in[0] <== dailyRecipes[i][2];
        validIce.in[1] <== 2; // Minimum 2 ice cubes per cup
        
        // Verify price
        component validPrice = GreaterEqThan(8);
        validPrice.in[0] <== dailyPrices[i];
        validPrice.in[1] <== 25; // Minimum $0.25
        
        // Calculate daily revenue
        component salesCalc = DailySales();
        salesCalc.weather <== dailyWeather[i];
        salesCalc.advertising <== dailyAdvertising[i];
        salesCalc.price <== dailyPrices[i];
        
        dailyRevenue[i] <== salesCalc.sales * dailyPrices[i];
        
        // Verify state transitions
        if (i > 0) {
            // Money should increase by revenue
            component moneyCheck = IsEqual();
            moneyCheck.in[0] <== dailyStates[i][0];
            moneyCheck.in[1] <== dailyStates[i-1][0] + dailyRevenue[i-1];
            dailyValid[i] <== moneyCheck.out;
            
            // Resources should decrease based on sales
            component lemonsCheck = IsEqual();
            lemonsCheck.in[0] <== dailyStates[i][1];
            lemonsCheck.in[1] <== dailyStates[i-1][1] - (salesCalc.sales * dailyRecipes[i-1][0]);
            dailyValid[i] *= lemonsCheck.out;
            
            component sugarCheck = IsEqual();
            sugarCheck.in[0] <== dailyStates[i][2];
            sugarCheck.in[1] <== dailyStates[i-1][2] - (salesCalc.sales * dailyRecipes[i-1][1]);
            dailyValid[i] *= sugarCheck.out;
            
            component iceCheck = IsEqual();
            iceCheck.in[0] <== dailyStates[i][3];
            iceCheck.in[1] <== dailyStates[i-1][3] - (salesCalc.sales * dailyRecipes[i-1][2]);
            dailyValid[i] *= iceCheck.out;
        } else {
            // First day should match starting money
            component startMoneyCheck = IsEqual();
            startMoneyCheck.in[0] <== dailyStates[0][0];
            startMoneyCheck.in[1] <== startingMoney;
            dailyValid[0] <== startMoneyCheck.out;
        }
        
        // Hash the daily state
        stateHasher.inputs[i*4] <== dailyStates[i][0];
        stateHasher.inputs[i*4 + 1] <== dailyStates[i][1];
        stateHasher.inputs[i*4 + 2] <== dailyStates[i][2];
        stateHasher.inputs[i*4 + 3] <== dailyStates[i][3];
        
        // Accumulate score
        if (i < daysPlayed) {
            runningScore += dailyStates[i][0];
        }
    }
    
    // Verify game state hash
    component hashCheck = IsEqual();
    hashCheck.in[0] <== stateHasher.out;
    hashCheck.in[1] <== gameStateHash;
    stateHashValid <== hashCheck.out;
    
    // Verify final score matches
    component scoreCheck = IsEqual();
    scoreCheck.in[0] <== finalScore * daysPlayed;
    scoreCheck.in[1] <== runningScore;
    signal scoreValid;
    scoreValid <== scoreCheck.out;
    
    // Final validity check combines all constraints
    signal output isValid;
    signal output verifiedScore;
    
    isValid <== stateHashValid * scoreValid;
    verifiedScore <== runningScore \ daysPlayed;
}

// Helper template for calculating daily sales
template DailySales() {
    signal input weather;
    signal input advertising;
    signal input price;
    
    signal output sales;
    
    // Weather multipliers: rainy=0.5, cloudy=1.0, sunny=1.5
    signal weatherMult;
    weatherMult <== 5 + weather * 5; // Multiply by 10 to avoid decimals
    
    // Ad multipliers: none=0.8, flyers=1.2, social=1.8, radio=2.5
    signal adMult;
    adMult <== 8 + advertising * 7; // Multiply by 10 to avoid decimals
    
    // Price impact (lower price = more sales)
    signal priceMult;
    priceMult <== (400 - price); // Already in cents
    
    // Calculate final sales (divide by 100 to account for multiplier scaling)
    sales <== (weatherMult * adMult * priceMult) \ 100;
}

component main = LemonadeGame(7); // 7 days max 