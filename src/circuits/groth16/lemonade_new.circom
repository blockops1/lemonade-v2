pragma circom 2.2.2;

include "poseidon.circom";
include "comparators.circom";

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
    
    // Declare all components upfront
    component validLemons[maxDays];
    component validSugar[maxDays];
    component validIce[maxDays];
    component validPrice[maxDays];
    component salesCalc[maxDays];
    component moneyCheck[maxDays];
    component lemonsCheck[maxDays];
    component sugarCheck[maxDays];
    component iceCheck[maxDays];
    component startMoneyCheck = IsEqual();
    
    // Initialize components
    for (var i = 0; i < maxDays; i++) {
        validLemons[i] = GreaterEqThan(8);
        validSugar[i] = GreaterEqThan(8);
        validIce[i] = GreaterEqThan(8);
        validPrice[i] = GreaterEqThan(8);
        salesCalc[i] = DailySales();
        moneyCheck[i] = IsEqual();
        lemonsCheck[i] = IsEqual();
        sugarCheck[i] = IsEqual();
        iceCheck[i] = IsEqual();
    }
    
    // Verify each day's state
    for (var i = 0; i < maxDays; i++) {
        // Verify recipe ratios
        validLemons[i].in[0] <== dailyRecipes[i][0];
        validLemons[i].in[1] <== 2; // Minimum 2 lemons per cup
        
        validSugar[i].in[0] <== dailyRecipes[i][1];
        validSugar[i].in[1] <== 1; // Minimum 1 sugar per cup
        
        validIce[i].in[0] <== dailyRecipes[i][2];
        validIce[i].in[1] <== 2; // Minimum 2 ice cubes per cup
        
        // Verify price
        validPrice[i].in[0] <== dailyPrices[i];
        validPrice[i].in[1] <== 25; // Minimum $0.25
        
        // Calculate daily revenue
        salesCalc[i].weather <== dailyWeather[i];
        salesCalc[i].advertising <== dailyAdvertising[i];
        salesCalc[i].price <== dailyPrices[i];
        
        dailyRevenue[i] <== salesCalc[i].sales * dailyPrices[i];
        
        // Verify state transitions
        if (i > 0) {
            // Money should increase by revenue
            moneyCheck[i].in[0] <== dailyStates[i][0];
            moneyCheck[i].in[1] <== dailyStates[i-1][0] + dailyRevenue[i-1];
            dailyValid[i] <== moneyCheck[i].out;
            
            // Resources should decrease based on sales
            lemonsCheck[i].in[0] <== dailyStates[i][1];
            lemonsCheck[i].in[1] <== dailyStates[i-1][1] - (salesCalc[i-1].sales * dailyRecipes[i-1][0]);
            dailyValid[i] <== dailyValid[i] * lemonsCheck[i].out;
            
            sugarCheck[i].in[0] <== dailyStates[i][2];
            sugarCheck[i].in[1] <== dailyStates[i-1][2] - (salesCalc[i-1].sales * dailyRecipes[i-1][1]);
            dailyValid[i] <== dailyValid[i] * sugarCheck[i].out;
            
            iceCheck[i].in[0] <== dailyStates[i][3];
            iceCheck[i].in[1] <== dailyStates[i-1][3] - (salesCalc[i-1].sales * dailyRecipes[i-1][2]);
            dailyValid[i] <== dailyValid[i] * iceCheck[i].out;
        } else {
            // First day should match starting money
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
            runningScore <== runningScore + dailyStates[i][0];
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
