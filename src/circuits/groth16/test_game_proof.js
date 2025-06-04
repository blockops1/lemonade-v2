const { LemonadeStand } = require('../../game/LemonadeStand');

async function testGameAndProof() {
    console.log('\n=== STARTING GAME TEST ===');
    const game = new LemonadeStand();
    
    // Day 1: Conservative start
    console.log('\nDay 1: Conservative strategy');
    game.buyIngredients('lemons', 20);  // 20 lemons
    game.buyIngredients('sugar', 10);   // 10 sugar
    game.buyIngredients('ice', 30);     // 30 ice
    game.setLemonadePrice(3.00);        // Standard price
    game.setAdvertising('flyers');      // Basic advertising
    const day1 = game.simulateDay();
    console.log('Day 1 Results:', day1);

    // Day 2: Increase advertising
    console.log('\nDay 2: Increased advertising');
    game.buyIngredients('lemons', 30);
    game.buyIngredients('sugar', 15);
    game.buyIngredients('ice', 45);
    game.setLemonadePrice(2.50);        // Lower price
    game.setAdvertising('social');      // Better advertising
    const day2 = game.simulateDay();
    console.log('Day 2 Results:', day2);

    // Day 3: Premium strategy
    console.log('\nDay 3: Premium strategy');
    game.buyIngredients('lemons', 40);
    game.buyIngredients('sugar', 20);
    game.buyIngredients('ice', 60);
    game.setLemonadePrice(2.00);        // Competitive price
    game.setAdvertising('radio');       // Best advertising
    const day3 = game.simulateDay();
    console.log('Day 3 Results:', day3);

    // Day 4: Adjust based on weather
    console.log('\nDay 4: Weather adjustment');
    game.buyIngredients('lemons', 35);
    game.buyIngredients('sugar', 18);
    game.buyIngredients('ice', 55);
    game.setLemonadePrice(2.75);
    game.setAdvertising('social');
    const day4 = game.simulateDay();
    console.log('Day 4 Results:', day4);

    // Day 5: Conservative due to weather
    console.log('\nDay 5: Weather caution');
    game.buyIngredients('lemons', 25);
    game.buyIngredients('sugar', 13);
    game.buyIngredients('ice', 40);
    game.setLemonadePrice(3.00);
    game.setAdvertising('flyers');
    const day5 = game.simulateDay();
    console.log('Day 5 Results:', day5);

    // Day 6: Push for profit
    console.log('\nDay 6: Profit push');
    game.buyIngredients('lemons', 45);
    game.buyIngredients('sugar', 23);
    game.buyIngredients('ice', 70);
    game.setLemonadePrice(2.25);
    game.setAdvertising('radio');
    const day6 = game.simulateDay();
    console.log('Day 6 Results:', day6);

    // Day 7: Final day blast
    console.log('\nDay 7: Final push');
    game.buyIngredients('lemons', 50);
    game.buyIngredients('sugar', 25);
    game.buyIngredients('ice', 75);
    game.setLemonadePrice(2.00);
    game.setAdvertising('radio');
    const day7 = game.simulateDay();
    console.log('Day 7 Results:', day7);

    // Get final game state
    const gameState = game.getState();
    console.log('\nFinal Game State:', gameState);

    // Generate proof input
    console.log('\n=== PREPARING PROOF INPUT ===');
    const input = {
        startingMoney: 1200,  // $120.00 in 10-cent units
        finalMoney: gameState.money,
        daysPlayed: 7,
        dailyMoney: gameState.salesHistory.map(day => day.money),
        dailyRevenue: gameState.salesHistory.map(day => day.revenue),
        dailyAdCosts: gameState.salesHistory.map(day => day.advertisingCost)
    };
    console.log('Proof Input:', input);

    try {
        // Import the necessary verification functions
        const { generateProof, verifyProof } = await import('./build/verify.js');

        // Generate the proof
        console.log('\n=== GENERATING PROOF ===');
        const { proof, publicSignals } = await generateProof(input);
        console.log('Proof generated successfully');
        console.log('Public Signals:', publicSignals);

        // Verify the proof
        console.log('\n=== VERIFYING PROOF ===');
        const isValid = await verifyProof(proof, publicSignals);
        console.log('Proof verification result:', isValid);

        return { success: true, isValid };
    } catch (error) {
        console.error('Error in proof generation/verification:', error);
        return { success: false, error: error.message };
    }
}

// Run the test
testGameAndProof().then(result => {
    if (result.success) {
        console.log('\n✅ Test completed successfully!');
        console.log('Proof validity:', result.isValid);
    } else {
        console.log('\n❌ Test failed!');
        console.log('Error:', result.error);
    }
}); 