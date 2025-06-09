pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";

// Template to verify ad cost is valid
template ValidateAdCost() {
    signal input cost;
    signal output isValid;
    
    // Check if cost matches any valid value (0, 90, 240, 450)
    signal is0;
    signal is90;
    signal is240;
    signal is450;
    
    is0 <== (cost - 0) * 0 + 1;
    is90 <== (cost - 90) * 0 + 1;
    is240 <== (cost - 240) * 0 + 1;
    is450 <== (cost - 450) * 0 + 1;
    
    isValid <== is0 + is90 + is240 + is450 - 3; // Will be 1 if exactly one matches
}

// Template to verify a single day's money calculation
template DailyMoneyCheck() {
    signal input prevMoney;
    signal input revenue;
    signal input adCost;
    signal input actualMoney;
    signal output isValid;
    
    // Calculate expected money
    signal expectedMoney;
    expectedMoney <== prevMoney + revenue - adCost;
    
    // Check if actual matches expected
    component moneyEqual = IsEqual();
    moneyEqual.in[0] <== actualMoney;
    moneyEqual.in[1] <== expectedMoney;
    isValid <== moneyEqual.out;
}

template LemonadeBasic(maxDays) {
    // Public inputs
    signal input startingMoney;  // Initial money (1200 = $120.00)
    signal input finalMoney;     // Final money amount
    signal input daysPlayed;     // Should be 7

    // Private inputs
    signal input dailyMoney[maxDays];     // Money at end of each day (max 32,767 = $3,276.70)
    signal input dailyRevenue[maxDays];   // Revenue for each day
    signal input dailyAdCosts[maxDays];   // Advertising costs (0, 90, 240, or 450)

    // Output
    signal output valid;

    // Intermediate signals
    signal daysValid;
    signal moneyChecksValid[maxDays];
    signal adCostsValid[maxDays];
    signal finalMoneyValid;
    signal wonGame;
    signal moneyValidAccum[maxDays];
    signal adCostValidAccum[maxDays];
    signal validationStep1;
    signal validationStep2;
    signal validationStep3;

    // Step 1: Verify days played
    component daysEqual = IsEqual();
    daysEqual.in[0] <== daysPlayed;
    daysEqual.in[1] <== maxDays;
    daysValid <== daysEqual.out;

    // Step 2: Verify first day's calculation
    component day0Check = DailyMoneyCheck();
    day0Check.prevMoney <== startingMoney;
    day0Check.revenue <== dailyRevenue[0];
    day0Check.adCost <== dailyAdCosts[0];
    day0Check.actualMoney <== dailyMoney[0];
    moneyChecksValid[0] <== day0Check.isValid;

    // Step 3: Verify subsequent days' calculations
    component dailyChecks[maxDays-1];
    for (var i = 1; i < maxDays; i++) {
        dailyChecks[i-1] = DailyMoneyCheck();
        dailyChecks[i-1].prevMoney <== dailyMoney[i-1];
        dailyChecks[i-1].revenue <== dailyRevenue[i];
        dailyChecks[i-1].adCost <== dailyAdCosts[i];
        dailyChecks[i-1].actualMoney <== dailyMoney[i];
        moneyChecksValid[i] <== dailyChecks[i-1].isValid;
    }

    // Step 4: Verify ad costs
    component adCostValidators[maxDays];
    for (var i = 0; i < maxDays; i++) {
        adCostValidators[i] = ValidateAdCost();
        adCostValidators[i].cost <== dailyAdCosts[i];
        adCostsValid[i] <== adCostValidators[i].isValid;
    }

    // Step 5: Verify final money
    component finalMoneyEqual = IsEqual();
    finalMoneyEqual.in[0] <== finalMoney;
    finalMoneyEqual.in[1] <== dailyMoney[maxDays-1];
    finalMoneyValid <== finalMoneyEqual.out;

    // Step 6: Verify player won (15 bits is enough for our money values)
    component wonCheck = GreaterThan(15);  // Max value 32,767 ($3,276.70)
    wonCheck.in[0] <== finalMoney;
    wonCheck.in[1] <== startingMoney;
    wonGame <== wonCheck.out;

    // Accumulate validations
    moneyValidAccum[0] <== moneyChecksValid[0];
    adCostValidAccum[0] <== adCostsValid[0];
    
    for (var i = 1; i < maxDays; i++) {
        moneyValidAccum[i] <== moneyValidAccum[i-1] * moneyChecksValid[i];
        adCostValidAccum[i] <== adCostValidAccum[i-1] * adCostsValid[i];
    }

    // Break down final validation into quadratic steps
    validationStep1 <== daysValid * moneyValidAccum[maxDays-1];
    validationStep2 <== validationStep1 * adCostValidAccum[maxDays-1];
    validationStep3 <== validationStep2 * finalMoneyValid;
    valid <== validationStep3 * wonGame;
}

component main {public [startingMoney, finalMoney, daysPlayed]} = LemonadeBasic(7); 