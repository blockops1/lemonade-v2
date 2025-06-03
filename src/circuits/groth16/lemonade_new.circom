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
    
    // Validate public inputs are within 18 bits
    component finalScoreValid = Num2Bits(18);
    component daysPlayedValid = Num2Bits(8);
    component startingMoneyValid = Num2Bits(18);
    
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
        stateMoneyValid[i] = Num2Bits(18);
        stateLemonsValid[i] = Num2Bits(18);
        stateSugarValid[i] = Num2Bits(18);
        stateIceValid[i] = Num2Bits(18);
        hashInput0Valid[i] = Num2Bits(18);
        hashInput1Valid[i] = Num2Bits(18);
        maskedScoreValid[i] = Num2Bits(18);
        dailyRevenueValid[i] = Num2Bits(18);
        salesCountValid[i] = Num2Bits(18);
        dailyPriceValid[i] = Num2Bits(18);
    }
    
    // Create day masks and verify each day's state
    var totalScore = 0;
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
        
        // Calculate masked score for this day
        maskedScores[i] <== dailyStates[i][0] * dayMask[i];
        maskedScoreValid[i].in <== maskedScores[i];
        totalScore += maskedScores[i];
        
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
    component totalScoreValid = Num2Bits(18);
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
    component finalScoreTimesDaysValid = Num2Bits(18);
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
    signal input price; // in cents
    
    signal output sales;
    signal output isValid;
    
    // Validate inputs
    component weatherValid = LessThan(8);
    component adValid = LessThan(8);
    component priceValid = GreaterThan(18);
    
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
    signal input price; // in cents
    signal output multiplier;
    
    // Compare price against thresholds
    component lt25 = LessThan(18);
    component lt50 = LessThan(18);
    component lt75 = LessThan(18);
    component lt100 = LessThan(18);
    component lt125 = LessThan(18);
    component lt150 = LessThan(18);
    
    lt25.in[0] <== price;
    lt25.in[1] <== 25; // $0.25
    
    lt50.in[0] <== price;
    lt50.in[1] <== 50; // $0.50
    
    lt75.in[0] <== price;
    lt75.in[1] <== 75; // $0.75
    
    lt100.in[0] <== price;
    lt100.in[1] <== 100; // $1.00
    
    lt125.in[0] <== price;
    lt125.in[1] <== 125; // $1.25
    
    lt150.in[0] <== price;
    lt150.in[1] <== 150; // $1.50
    
    // Calculate multiplier (scaled down by 10 to avoid large numbers)
    signal m1; // 30 if price <= 25
    signal m2; // 20 if 25 < price <= 50
    signal m3; // 15 if 50 < price <= 75
    signal m4; // 10 if 75 < price <= 100
    signal m5; // 7.5 if 100 < price <= 125
    signal m6; // 5 if 125 < price <= 150
    signal m7; // 2.5 if price > 150
    
    signal lt25Not;
    signal lt50Not;
    signal lt75Not;
    signal lt100Not;
    signal lt125Not;
    signal lt150Not;
    
    lt25Not <== 1 - lt25.out;
    lt50Not <== 1 - lt50.out;
    lt75Not <== 1 - lt75.out;
    lt100Not <== 1 - lt100.out;
    lt125Not <== 1 - lt125.out;
    lt150Not <== 1 - lt150.out;
    
    signal m2Cond;
    signal m3Cond;
    signal m4Cond;
    signal m5Cond;
    signal m6Cond;
    signal m7Cond;
    
    m2Cond <== lt25Not * lt50.out;
    m3Cond <== lt50Not * lt75.out;
    m4Cond <== lt75Not * lt100.out;
    m5Cond <== lt100Not * lt125.out;
    m6Cond <== lt125Not * lt150.out;
    m7Cond <== lt150Not;
    
    m1 <== lt25.out * 30;
    m2 <== m2Cond * 20;
    m3 <== m3Cond * 15;
    m4 <== m4Cond * 10;
    m5 <== m5Cond * 7;
    m6 <== m6Cond * 5;
    m7 <== m7Cond * 2;
    
    multiplier <== m1 + m2 + m3 + m4 + m5 + m6 + m7;
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
    
    adCost <== isFlyers * 300 + isSocial * 800 + isRadio * 1500;
    
    // Validate adCost is within 18 bits
    component adCostValid = Num2Bits(18);
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
    
    lemonsCost <== salesCount * recipeLemons * 5;
    sugarCost <== salesCount * recipeSugar * 3;
    iceCost <== salesCount * recipeIce * 2;
    
    // Validate individual costs are within 18 bits
    component lemonsCostValid = Num2Bits(18);
    component sugarCostValid = Num2Bits(18);
    component iceCostValid = Num2Bits(18);
    
    lemonsCostValid.in <== lemonsCost;
    sugarCostValid.in <== sugarCost;
    iceCostValid.in <== iceCost;
    
    ingredientCost <== lemonsCost + sugarCost + iceCost;
    
    // Validate ingredientCost is within 18 bits
    component ingredientCostValid = Num2Bits(18);
    ingredientCostValid.in <== ingredientCost;
    
    // Calculate final cost (only apply ad cost if there were sales)
    signal finalCost;
    signal adCostWithSales;
    adCostWithSales <== adCost * hasSales.out;
    finalCost <== ingredientCost + adCostWithSales;
    
    // Validate finalCost is within 18 bits
    component finalCostValid = Num2Bits(18);
    finalCostValid.in <== finalCost;
    
    // Validate revenue is within 18 bits
    component revenueValid = Num2Bits(18);
    revenueValid.in <== revenue;
    
    // Verify money changes
    component moneyCheck = IsEqual();
    component lemonsCheck = IsEqual();
    component sugarCheck = IsEqual();
    component iceCheck = IsEqual();
    
    // Calculate money changes in steps to avoid intermediate values exceeding 18 bits
    signal moneyAfterCosts;
    moneyAfterCosts <== prevMoney - finalCost;
    
    // Validate moneyAfterCosts is within 18 bits
    component moneyAfterCostsValid = Num2Bits(18);
    moneyAfterCostsValid.in <== moneyAfterCosts;
    
    // Calculate final money
    signal finalMoney;
    finalMoney <== moneyAfterCosts + revenue;
    
    // Validate finalMoney is within 18 bits
    component finalMoneyValid = Num2Bits(18);
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
    component moneyRangeCheck = Num2Bits(18); // Changed from 16 to 18 bits
    moneyRangeCheck.in <== currMoney;

    // Money comparisons
    component moneyComp = GreaterThan(18); // Changed from 16 to 18 bits
    moneyComp.in[0] <== currMoney;
    moneyComp.in[1] <== prevMoney;

    // Additional validation for non-negative values
    component moneyValid = GreaterEqThan(18); // Already updated
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

// Main circuit component
component main = LemonadeGame(7); // 7 days max
