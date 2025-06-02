pragma circom 2.1.4;

include "circomlib/poseidon.circom";
include "circomlib/comparators.circom";

/*
 * Main circuit for verifying lemonade stand game state
 * Inputs:
 * - recipe ratios (lemons, sugar, ice per cup)
 * - price per cup
 * - weather condition (encoded as 0=rainy, 1=cloudy, 2=sunny)
 * - advertising level (0=none, 1=flyers, 2=social, 3=radio)
 * - current inventory
 * Outputs:
 * - valid recipe flag
 * - expected sales
 * - expected revenue
 */
template LemonadeGame() {
    // Public inputs
    signal input weatherCondition;
    signal input advertisingLevel;
    signal input pricePerCup;
    
    // Private inputs
    signal input lemonsPerCup;
    signal input sugarPerCup;
    signal input icePerCup;
    signal input inventory[3]; // [lemons, sugar, ice]
    
    // Intermediate signals
    signal recipeValid;
    signal weatherMultiplier;
    signal adMultiplier;
    signal priceMultiplier;
    
    // Outputs
    signal output isValid;
    signal output expectedSales;
    signal output expectedRevenue;
    
    // Verify recipe ratios
    component validLemons = GreaterEqThan(8);
    validLemons.in[0] <== lemonsPerCup;
    validLemons.in[1] <== 2; // Minimum 2 lemons per cup
    
    component validSugar = GreaterEqThan(8);
    validSugar.in[0] <== sugarPerCup;
    validSugar.in[1] <== 1; // Minimum 1 sugar per cup
    
    component validIce = GreaterEqThan(8);
    validIce.in[0] <== icePerCup;
    validIce.in[1] <== 2; // Minimum 2 ice cubes per cup
    
    recipeValid <== validLemons.out * validSugar.out * validIce.out;
    
    // Calculate weather multiplier
    component weatherCheck = LessThan(8);
    weatherCheck.in[0] <== weatherCondition;
    weatherCheck.in[1] <== 3;
    
    // Weather multipliers: rainy=0.5, cloudy=1.0, sunny=1.5
    weatherMultiplier <== 0.5 + weatherCondition * 0.5;
    
    // Calculate advertising multiplier
    component adCheck = LessThan(8);
    adCheck.in[0] <== advertisingLevel;
    adCheck.in[1] <== 4;
    
    // Ad multipliers: none=0.8, flyers=1.2, social=1.8, radio=2.5
    adMultiplier <== 0.8 + advertisingLevel * 0.7;
    
    // Calculate price impact (lower price = more sales)
    component priceCheck = GreaterEqThan(8);
    priceCheck.in[0] <== pricePerCup;
    priceCheck.in[1] <== 25; // Minimum $0.25
    
    priceMultiplier <== (400 - pricePerCup) / 100; // Price impact formula
    
    // Calculate expected sales
    expectedSales <== weatherMultiplier * adMultiplier * priceMultiplier * 10;
    
    // Calculate expected revenue
    expectedRevenue <== expectedSales * pricePerCup;
    
    // Final validity check
    isValid <== recipeValid * weatherCheck.out * adCheck.out * priceCheck.out;
}

component main = LemonadeGame(); 