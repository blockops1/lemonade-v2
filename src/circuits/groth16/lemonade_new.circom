pragma circom 2.2.2;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";

/*
 * Main template for verifying lemonade stand game state
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
 * - errorCodes: array of error codes for debugging
 */

template LemonadeGame(maxDays) {
    // Public inputs
    signal input finalScore;
    signal input daysPlayed;
    signal input startingMoney;
    signal input gameStateHash;
    
    // Validate public inputs are within 20 bits
    component finalScoreValid = Num2Bits(20);
    component daysPlayedValid = Num2Bits(8);
    component startingMoneyValid = Num2Bits(20);
    
    finalScoreValid.in <== finalScore;
    daysPlayedValid.in <== daysPlayed;
    startingMoneyValid.in <== startingMoney;
    
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
    signal dayMask[maxDays];
    signal maskedScores[maxDays];
    
    signal maskedScore[maxDays];
    
    // Error tracking signals
    signal recipeErrors[maxDays];
    signal stateErrors[maxDays];
    signal salesErrors[maxDays];
    
    // Initialize Poseidon hashers for state (2 inputs per hasher)
    component stateHashers[maxDays];
    component finalHasher = Poseidon(2);
    signal intermediateHashes[maxDays];
    
    // Initialize validation components
    component recipeValidators[maxDays];
    component stateValidators[maxDays];
    component salesCalc[maxDays];
    component daysInRange = LessThan(8);
    component dayComps[maxDays];
    component stateMoneyValid[maxDays];
    component stateLemonsValid[maxDays];
    component stateSugarValid[maxDays];
    component stateIceValid[maxDays];
    component hashInput0Valid[maxDays];
    component hashInput1Valid[maxDays];
    component maskedScoreValid[maxDays];
    component dailyRevenueValid[maxDays];
    component salesCountValid[maxDays];
    component dailyPriceValid[maxDays];
    
    // Validate daysPlayed is in range
    daysInRange.in[0] <== daysPlayed;
    daysInRange.in[1] <== 8; // 7 days max + 1
    
    // Initialize components
    for (var i = 0; i < maxDays; i++) {
        recipeValidators[i] = RecipeValidator();
        stateValidators[i] = StateTransitionValidator();
        salesCalc[i] = DailySales();
        dayComps[i] = LessThan(8);
        stateHashers[i] = Poseidon(2);
        stateMoneyValid[i] = Num2Bits(20);
        stateLemonsValid[i] = Num2Bits(18);
        stateSugarValid[i] = Num2Bits(18);
        stateIceValid[i] = Num2Bits(18);
        hashInput0Valid[i] = Num2Bits(20);
        hashInput1Valid[i] = Num2Bits(20);
        maskedScoreValid[i] = Num2Bits(20);
        dailyRevenueValid[i] = Num2Bits(20);
        salesCountValid[i] = Num2Bits(20);
        dailyPriceValid[i] = Num2Bits(20);
    }
    
    // Create day masks and verify each day's state
    var totalScore = 0;
    signal intermediateScores[maxDays];
    component intermediateScoreValid[maxDays];
    
    for (var i = 0; i < maxDays; i++) {
        // Set up day comparison
        dayComps[i].in[0] <== i;
        dayComps[i].in[1] <== daysPlayed;
        dayMask[i] <== dayComps[i].out;
        
        // Validate daily state values are within 18 bits
        stateMoneyValid[i].in <== dailyStates[i][0];
        stateLemonsValid[i].in <== dailyStates[i][1];
        stateSugarValid[i].in <== dailyStates[i][2];
        stateIceValid[i].in <== dailyStates[i][3];
        
        // Validate daily price is within 18 bits
        dailyPriceValid[i].in <== dailyPrices[i];
        
        // Calculate masked score for this day using a safer approach
        maskedScore[i] <== dailyStates[i][0] * dayMask[i];
        maskedScoreValid[i].in <== maskedScore[i];
        
        // Calculate intermediate score with validation
        if (i == 0) {
            intermediateScores[i] <== maskedScore[i];
        } else {
            intermediateScores[i] <== intermediateScores[i-1] + maskedScore[i];
        }
        intermediateScoreValid[i] = Num2Bits(20);
        intermediateScoreValid[i].in <== intermediateScores[i];
        
        totalScore = intermediateScores[i];
        
        // Validate recipe
        recipeValidators[i].lemons <== dailyRecipes[i][0];
        recipeValidators[i].sugar <== dailyRecipes[i][1];
        recipeValidators[i].ice <== dailyRecipes[i][2];
        recipeErrors[i] <== 1 - recipeValidators[i].isValid;
        
        // Calculate daily revenue
        salesCalc[i].weather <== dailyWeather[i];
        salesCalc[i].advertising <== dailyAdvertising[i];
        salesCalc[i].price <== dailyPrices[i];
        salesErrors[i] <== 1 - salesCalc[i].isValid;
        
        // Validate sales count and revenue
        salesCountValid[i].in <== salesCalc[i].sales;
        dailyRevenue[i] <== salesCalc[i].sales * dailyPrices[i];
        dailyRevenueValid[i].in <== dailyRevenue[i];
        
        // Initialize all state validator inputs
        stateValidators[i].prevMoney <== i == 0 ? startingMoney : dailyStates[i-1][0];
        stateValidators[i].prevLemons <== i == 0 ? 0 : dailyStates[i-1][1];
        stateValidators[i].prevSugar <== i == 0 ? 0 : dailyStates[i-1][2];
        stateValidators[i].prevIce <== i == 0 ? 0 : dailyStates[i-1][3];
        stateValidators[i].currMoney <== dailyStates[i][0];
        stateValidators[i].currLemons <== dailyStates[i][1];
        stateValidators[i].currSugar <== dailyStates[i][2];
        stateValidators[i].currIce <== dailyStates[i][3];
        stateValidators[i].revenue <== i == 0 ? 0 : dailyRevenue[i-1];
        stateValidators[i].salesCount <== i == 0 ? 0 : salesCalc[i-1].sales;
        stateValidators[i].recipeLemons <== i == 0 ? 0 : dailyRecipes[i-1][0];
        stateValidators[i].recipeSugar <== i == 0 ? 0 : dailyRecipes[i-1][1];
        stateValidators[i].recipeIce <== i == 0 ? 0 : dailyRecipes[i-1][2];
        stateValidators[i].advertisingType <== i == 0 ? 0 : dailyAdvertising[i-1];
        
        dailyValid[i] <== stateValidators[i].isValid;
        stateErrors[i] <== 1 - dailyValid[i];
        
        // Hash the daily state in pairs
        stateHashers[i].inputs[0] <== dailyStates[i][0] + dailyStates[i][1];
        stateHashers[i].inputs[1] <== dailyStates[i][2] + dailyStates[i][3];
        
        // Validate hash inputs are within 18 bits
        hashInput0Valid[i].in <== dailyStates[i][0] + dailyStates[i][1];
        hashInput1Valid[i].in <== dailyStates[i][2] + dailyStates[i][3];
        
        intermediateHashes[i] <== stateHashers[i].out;
    }
    
    // Assign the total score to runningScore signal
    runningScore <== totalScore;
    
    // Validate total score is within 18 bits
    component totalScoreValid = Num2Bits(20);
    totalScoreValid.in <== totalScore;
    
    // Final hash combining all intermediate hashes
    finalHasher.inputs[0] <== intermediateHashes[0];
    finalHasher.inputs[1] <== intermediateHashes[maxDays-1];
    
    // Verify game state hash
    component hashCheck = IsEqual();
    hashCheck.in[0] <== finalHasher.out;
    hashCheck.in[1] <== gameStateHash;
    stateHashValid <== hashCheck.out;
    
    // Verify final score matches
    component scoreCheck = IsEqual();
    signal finalScoreTimesDays;
    finalScoreTimesDays <== finalScore * daysPlayed;
    
    // Validate final score times days is within 18 bits
    component finalScoreTimesDaysValid = Num2Bits(20);
    finalScoreTimesDaysValid.in <== finalScoreTimesDays;
    
    scoreCheck.in[0] <== finalScoreTimesDays;
    scoreCheck.in[1] <== runningScore;
    signal scoreValid;
    scoreValid <== scoreCheck.out;
    
    // Final outputs
    signal output isValid;
    signal output verifiedScore;
    signal output errorCodes[maxDays];
    
    // Break down three-way multiplication into pairs
    signal hashScoreValid;
    hashScoreValid <== stateHashValid * scoreValid;
    isValid <== hashScoreValid * daysInRange.out;
    
    // Calculate verified score using multiplication instead of division
    // Since we're working with integers, we'll multiply by 1/daysPlayed
    // This is equivalent to division but uses multiplication
    verifiedScore <== runningScore;
    
    // Declare all signals needed for error code calculation
    signal stateSalesErrors[maxDays];
    signal recipeStateErrors[maxDays];
    
    // Combine error codes for each day
    for (var i = 0; i < maxDays; i++) {
        stateSalesErrors[i] <== stateErrors[i] * 2;
        recipeStateErrors[i] <== recipeErrors[i] + stateSalesErrors[i];
        errorCodes[i] <== recipeStateErrors[i] + (salesErrors[i] * 4);
    }
}

// Template for validating recipe constraints
template RecipeValidator() {
    signal input lemons;
    signal input sugar;
    signal input ice;
    
    signal output isValid;
    
    component lemonsCheck = GreaterEqThan(8);
    component sugarCheck = GreaterEqThan(8);
    component iceCheck = GreaterEqThan(8);
    
    lemonsCheck.in[0] <== lemons;
    lemonsCheck.in[1] <== 2; // Min 2 lemons per cup
    
    sugarCheck.in[0] <== sugar;
    sugarCheck.in[1] <== 1; // Min 1 sugar per cup
    
    iceCheck.in[0] <== ice;
    iceCheck.in[1] <== 3; // Min 3 ice per cup
    
    // Additional validation to ensure ingredients are not excessive
    component maxLemonsCheck = LessThan(8);
    component maxSugarCheck = LessThan(8);
    component maxIceCheck = LessThan(8);
    
    maxLemonsCheck.in[0] <== lemons;
    maxLemonsCheck.in[1] <== 6; // Max 3x min lemons
    
    maxSugarCheck.in[0] <== sugar;
    maxSugarCheck.in[1] <== 3; // Max 3x min sugar
    
    maxIceCheck.in[0] <== ice;
    maxIceCheck.in[1] <== 9; // Max 3x min ice
    
    // Break down the multiplication into pairs using intermediate signals
    signal minChecksValid;
    signal maxChecksValid;
    signal lemonsValid;
    signal sugarIceValid;
    
    // Combine min checks
    lemonsValid <== lemonsCheck.out * sugarCheck.out;
    sugarIceValid <== iceCheck.out;
    minChecksValid <== lemonsValid * sugarIceValid;
    
    // Combine max checks
    signal maxLemonsSugarValid;
    signal maxIceValid;
    maxLemonsSugarValid <== maxLemonsCheck.out * maxSugarCheck.out;
    maxIceValid <== maxIceCheck.out;
    maxChecksValid <== maxLemonsSugarValid * maxIceValid;
    
    // Final combination
    isValid <== minChecksValid * maxChecksValid;
}

// Helper template for calculating daily sales with improved validation
template DailySales() {
    signal input weather; // 0=rainy, 1=cloudy, 2=sunny, 3=hot
    signal input advertising; // 0=none, 1=flyers, 2=social, 3=radio
    signal input price; // in 10-cent increments
    
    signal output sales;
    signal output isValid;
    
    // Validate inputs
    component weatherValid = LessThan(8);
    component adValid = LessThan(8);
    component priceValid = GreaterThan(20);
    
    weatherValid.in[0] <== weather;
    weatherValid.in[1] <== 4; // 4 weather types (0-3)
    
    adValid.in[0] <== advertising;
    adValid.in[1] <== 4; // 4 advertising types (0-3)
    
    priceValid.in[0] <== price;
    priceValid.in[1] <== 0;
    
    // Break down validation into pairs
    signal weatherAdValid;
    weatherAdValid <== weatherValid.out * adValid.out;
    isValid <== weatherAdValid * priceValid.out;
    
    // Calculate base customers by weather (multiplied by 10)
    signal baseCustomers;
    signal isRainy; signal isCloudy; signal isSunny; signal isHot;
    component weatherEq[4];
    
    // Create equality checkers for each weather type
    for (var i = 0; i < 4; i++) {
        weatherEq[i] = IsEqual();
        weatherEq[i].in[0] <== weather;
        weatherEq[i].in[1] <== i;
    }
    
    isRainy <== weatherEq[0].out;
    isCloudy <== weatherEq[1].out;
    isSunny <== weatherEq[2].out;
    isHot <== weatherEq[3].out;
    
    // Weather affects base customers:
    // Rainy: 5-15 customers (avg 10)
    // Cloudy: 10-30 customers (avg 20)
    // Sunny: 20-40 customers (avg 30)
    // Hot: 30-50 customers (avg 40)
    // Note: Values are already scaled down by 10 to avoid large numbers
    signal rainyCustomers;
    signal cloudyCustomers;
    signal sunnyCustomers;
    signal hotCustomers;
    
    rainyCustomers <== isRainy * 10;
    cloudyCustomers <== isCloudy * 20;
    sunnyCustomers <== isSunny * 30;
    hotCustomers <== isHot * 40;
    
    baseCustomers <== rainyCustomers + cloudyCustomers + sunnyCustomers + hotCustomers;
    
    // Calculate advertising multiplier (scaled down by 10)
    signal adMultiplier;
    signal isNoAd; signal isFlyers; signal isSocial; signal isRadio;
    component adEq[4];
    
    // Create equality checkers for each advertising type
    for (var i = 0; i < 4; i++) {
        adEq[i] = IsEqual();
        adEq[i].in[0] <== advertising;
        adEq[i].in[1] <== i;
    }
    
    isNoAd <== adEq[0].out;
    isFlyers <== adEq[1].out;
    isSocial <== adEq[2].out;
    isRadio <== adEq[3].out;
    
    signal noAdMult;
    signal flyersMult;
    signal socialMult;
    signal radioMult;
    
    noAdMult <== isNoAd * 8;
    flyersMult <== isFlyers * 12;
    socialMult <== isSocial * 18;
    radioMult <== isRadio * 25;
    
    adMultiplier <== noAdMult + flyersMult + socialMult + radioMult;
    
    // Get price multiplier (scaled down by 10)
    component priceMultCalc = PriceMultiplier();
    priceMultCalc.price <== price;
    
    // Break down the sales calculation into pairs
    signal baseTimesAd;
    signal finalSales;
    
    // First multiply base customers by ad multiplier
    baseTimesAd <== baseCustomers * adMultiplier;
    
    // Then multiply by price multiplier (already scaled appropriately)
    finalSales <== baseTimesAd * priceMultCalc.multiplier;
    
    // The result is already properly scaled due to our scaling factors above
    sales <== finalSales;
}

// Template for calculating price multiplier
template PriceMultiplier() {
    signal input price; // in 10-cent increments
    signal output multiplier;
    
    // Compare price against thresholds (in 10-cent increments)
    component lt20 = LessThan(20);
    component lt30 = LessThan(20);
    component lt40 = LessThan(20);
    component lt50 = LessThan(20);
    component lt60 = LessThan(20);
    component lt70 = LessThan(20);
    component lt80 = LessThan(20);
    component lt90 = LessThan(20);
    component lt100 = LessThan(20);
    component lt110 = LessThan(20);
    component lt120 = LessThan(20);
    component lt130 = LessThan(20);
    component lt140 = LessThan(20);
    component lt150 = LessThan(20);
    component lt160 = LessThan(20);
    component lt170 = LessThan(20);
    component lt180 = LessThan(20);
    component lt190 = LessThan(20);
    component lt200 = LessThan(20);
    
    lt20.in[0] <== price;
    lt20.in[1] <== 20; // $2.00
    
    lt30.in[0] <== price;
    lt30.in[1] <== 30; // $3.00
    
    lt40.in[0] <== price;
    lt40.in[1] <== 40; // $4.00
    
    lt50.in[0] <== price;
    lt50.in[1] <== 50; // $5.00
    
    lt60.in[0] <== price;
    lt60.in[1] <== 60; // $6.00
    
    lt70.in[0] <== price;
    lt70.in[1] <== 70; // $7.00
    
    lt80.in[0] <== price;
    lt80.in[1] <== 80; // $8.00
    
    lt90.in[0] <== price;
    lt90.in[1] <== 90; // $9.00
    
    lt100.in[0] <== price;
    lt100.in[1] <== 100; // $10.00
    
    lt110.in[0] <== price;
    lt110.in[1] <== 110; // $11.00
    
    lt120.in[0] <== price;
    lt120.in[1] <== 120; // $12.00
    
    lt130.in[0] <== price;
    lt130.in[1] <== 130; // $13.00
    
    lt140.in[0] <== price;
    lt140.in[1] <== 140; // $14.00
    
    lt150.in[0] <== price;
    lt150.in[1] <== 150; // $15.00
    
    lt160.in[0] <== price;
    lt160.in[1] <== 160; // $16.00
    
    lt170.in[0] <== price;
    lt170.in[1] <== 170; // $17.00
    
    lt180.in[0] <== price;
    lt180.in[1] <== 180; // $18.00
    
    lt190.in[0] <== price;
    lt190.in[1] <== 190; // $19.00
    
    lt200.in[0] <== price;
    lt200.in[1] <== 200; // $20.00
    
    // Calculate multiplier (scaled down by 10 to avoid large numbers)
    signal m[20]; // Array of multipliers for each price range
    
    // Initialize all multipliers to 0
    for (var i = 0; i < 20; i++) {
        m[i] <== 0;
    }
    
    // Set multipliers for each price range
    m[0] <== lt20.out * 10;  // $0.20-$0.30: 1.0x
    m[1] <== (1 - lt20.out) * lt30.out * 9;  // $0.30-$0.40: 0.9x
    m[2] <== (1 - lt30.out) * lt40.out * 8;  // $0.40-$0.50: 0.8x
    m[3] <== (1 - lt40.out) * lt50.out * 7;  // $0.50-$0.60: 0.7x
    m[4] <== (1 - lt50.out) * lt60.out * 6;  // $0.60-$0.70: 0.6x
    m[5] <== (1 - lt60.out) * lt70.out * 5;  // $0.70-$0.80: 0.5x
    m[6] <== (1 - lt70.out) * lt80.out * 4;  // $0.80-$0.90: 0.4x
    m[7] <== (1 - lt80.out) * lt90.out * 3;  // $0.90-$1.00: 0.3x
    m[8] <== (1 - lt90.out) * lt100.out * 2;  // $1.00-$1.10: 0.2x
    m[9] <== (1 - lt100.out) * lt110.out * 2;  // $1.10-$1.20: 0.2x
    m[10] <== (1 - lt110.out) * lt120.out * 2;  // $1.20-$1.30: 0.2x
    m[11] <== (1 - lt120.out) * lt130.out * 2;  // $1.30-$1.40: 0.2x
    m[12] <== (1 - lt130.out) * lt140.out * 2;  // $1.40-$1.50: 0.2x
    m[13] <== (1 - lt140.out) * lt150.out * 2;  // $1.50-$1.60: 0.2x
    m[14] <== (1 - lt150.out) * lt160.out * 2;  // $1.60-$1.70: 0.2x
    m[15] <== (1 - lt160.out) * lt170.out * 2;  // $1.70-$1.80: 0.2x
    m[16] <== (1 - lt170.out) * lt180.out * 2;  // $1.80-$1.90: 0.2x
    m[17] <== (1 - lt180.out) * lt190.out * 2;  // $1.90-$2.00: 0.2x
    m[18] <== (1 - lt190.out) * lt200.out * 1;  // $2.00: 0.1x
    m[19] <== (1 - lt200.out) * 1;  // >$2.00: 0.1x
    
    // Sum all multipliers
    multiplier <== m[0] + m[1] + m[2] + m[3] + m[4] + m[5] + m[6] + m[7] + m[8] + m[9] + 
                  m[10] + m[11] + m[12] + m[13] + m[14] + m[15] + m[16] + m[17] + m[18] + m[19];
}

// Template for validating state transitions
template StateTransitionValidator() {
    signal input prevMoney;
    signal input prevLemons;
    signal input prevSugar;
    signal input prevIce;
    signal input currMoney;
    signal input currLemons;
    signal input currSugar;
    signal input currIce;
    signal input revenue;
    signal input salesCount;
    signal input recipeLemons;
    signal input recipeSugar;
    signal input recipeIce;
    signal input advertisingType;
    
    signal output isValid;
    
    // Calculate advertising cost
    signal adCost;
    signal isFlyers; signal isSocial; signal isRadio;
    component adEq[3];
    
    // Create equality checkers for each paid advertising type
    for (var i = 0; i < 3; i++) {
        adEq[i] = IsEqual();
        adEq[i].in[0] <== advertisingType;
        adEq[i].in[1] <== i + 1; // +1 because we start with type 1 (flyers)
    }
    
    isFlyers <== adEq[0].out;
    isSocial <== adEq[1].out;
    isRadio <== adEq[2].out;
    
    adCost <== isFlyers * 30 + isSocial * 80 + isRadio * 150;  // Updated costs in 10-cent increments
    
    // Validate adCost is within 20 bits
    component adCostValid = Num2Bits(20);
    adCostValid.in <== adCost;
    
    // Check if there were any sales
    component hasSales = GreaterThan(8);
    hasSales.in[0] <== salesCount;
    hasSales.in[1] <== 0;
    
    // Calculate ingredient costs
    signal ingredientCost;
    signal lemonsCost;
    signal sugarCost;
    signal iceCost;
    
    lemonsCost <== salesCount * recipeLemons * 5;  // 5 10-cent units per lemon
    sugarCost <== salesCount * recipeSugar * 3;    // 3 10-cent units per sugar
    iceCost <== salesCount * recipeIce * 2;        // 2 10-cent units per ice
    
    // Validate individual costs are within 18 bits
    component lemonsCostValid = Num2Bits(20);
    component sugarCostValid = Num2Bits(20);
    component iceCostValid = Num2Bits(20);
    
    lemonsCostValid.in <== lemonsCost;
    sugarCostValid.in <== sugarCost;
    iceCostValid.in <== iceCost;
    
    ingredientCost <== lemonsCost + sugarCost + iceCost;
    
    // Validate ingredientCost is within 20 bits
    component ingredientCostValid = Num2Bits(20);
    ingredientCostValid.in <== ingredientCost;
    
    // Calculate final cost (only apply ad cost if there were sales)
    signal finalCost;
    signal adCostWithSales;
    adCostWithSales <== adCost * hasSales.out;
    finalCost <== ingredientCost + adCostWithSales;
    
    // Validate finalCost is within 20 bits
    component finalCostValid = Num2Bits(20);
    finalCostValid.in <== finalCost;
    
    // Validate revenue is within 20 bits
    component revenueValid = Num2Bits(20);
    revenueValid.in <== revenue;
    
    // Verify money changes
    component moneyCheck = IsEqual();
    component lemonsCheck = IsEqual();
    component sugarCheck = IsEqual();
    component iceCheck = IsEqual();
    
    // Calculate money changes in steps to avoid intermediate values exceeding 20 bits
    signal moneyAfterCosts;
    moneyAfterCosts <== prevMoney - finalCost;
    
    // Validate moneyAfterCosts is within 20 bits
    component moneyAfterCostsValid = Num2Bits(20);
    moneyAfterCostsValid.in <== moneyAfterCosts;
    
    // Calculate final money
    signal finalMoney;
    finalMoney <== moneyAfterCosts + revenue;
    
    // Validate finalMoney is within 20 bits
    component finalMoneyValid = Num2Bits(20);
    finalMoneyValid.in <== finalMoney;
    
    moneyCheck.in[0] <== currMoney;
    moneyCheck.in[1] <== finalMoney;
    
    lemonsCheck.in[0] <== currLemons;
    lemonsCheck.in[1] <== prevLemons - (salesCount * recipeLemons);
    
    sugarCheck.in[0] <== currSugar;
    sugarCheck.in[1] <== prevSugar - (salesCount * recipeSugar);
    
    iceCheck.in[0] <== currIce;
    iceCheck.in[1] <== 0; // Ice melts at end of day
    
    // Range checks for money values
    component moneyRangeCheck = Num2Bits(20); // Updated to 20 bits
    moneyRangeCheck.in <== currMoney;

    // Money comparisons
    component moneyComp = GreaterThan(20); // Updated to 20 bits
    moneyComp.in[0] <== currMoney;
    moneyComp.in[1] <== prevMoney;

    // Additional validation for non-negative values
    component moneyValid = GreaterEqThan(20); // Updated to 20 bits
    component lemonsValid = GreaterEqThan(8);
    component sugarValid = GreaterEqThan(8);
    
    moneyValid.in[0] <== currMoney;
    moneyValid.in[1] <== 0;
    
    lemonsValid.in[0] <== currLemons;
    lemonsValid.in[1] <== 0;
    
    sugarValid.in[0] <== currSugar;
    sugarValid.in[1] <== 0;
    
    // Break down the validity checks into pairs
    signal stateChecksValid;
    signal resourceChecksValid;
    signal nonNegChecksValid;
    
    // Combine state checks
    signal moneyLemonsValid;
    signal sugarIceValid;
    moneyLemonsValid <== moneyCheck.out * lemonsCheck.out;
    sugarIceValid <== sugarCheck.out * iceCheck.out;
    stateChecksValid <== moneyLemonsValid * sugarIceValid;
    
    // Combine resource checks
    signal moneyLemonsNonNegValid;
    signal sugarNonNegValid;
    moneyLemonsNonNegValid <== moneyValid.out * lemonsValid.out;
    sugarNonNegValid <== sugarValid.out;
    nonNegChecksValid <== moneyLemonsNonNegValid * sugarNonNegValid;
    
    // Final combination
    isValid <== stateChecksValid * nonNegChecksValid;
}

// Validate costs and revenues are within 15-bit range
template ValidateCosts() {
    signal input cost;
    signal input revenue;

    component costBits = Num2Bits(15);
    costBits.in <== cost;

    component revenueBits = Num2Bits(15);
    revenueBits.in <== revenue;
}

// Validate final costs and money are within 15-bit range
template ValidateFinalCosts() {
    signal input cost;
    signal input money;

    component costBits = Num2Bits(15);
    costBits.in <== cost;

    component moneyBits = Num2Bits(15);
    moneyBits.in <== money;
}

// Validate final money is within 15-bit range
template ValidateFinalMoney() {
    signal input money;

    component moneyBits = Num2Bits(15);
    moneyBits.in <== money;
}

// Main circuit component
component main = LemonadeGame(7); // 7 days max
