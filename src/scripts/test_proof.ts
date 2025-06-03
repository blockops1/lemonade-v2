import { LemonadeStand } from '../game/LemonadeStand';
import { useGroth16Proof } from '../hooks/useGroth16Proof';
import { useZkVerify } from '../hooks/useZkVerify';

async function testProofGeneration() {
    // Create a new game instance
    const game = new LemonadeStand();
    
    // Simulate a quick game
    // Day 1
    game.buyIngredients('lemons', 100);
    game.buyIngredients('sugar', 50);
    game.buyIngredients('ice', 100);
    game.setLemonadePrice(1.50);
    game.setAdvertising('flyers');
    game.simulateDay();

    // Day 2
    game.buyIngredients('lemons', 50);
    game.buyIngredients('sugar', 25);
    game.buyIngredients('ice', 50);
    game.setLemonadePrice(1.75);
    game.setAdvertising('social');
    game.simulateDay();

    // Day 3
    game.buyIngredients('lemons', 75);
    game.buyIngredients('sugar', 40);
    game.buyIngredients('ice', 75);
    game.setLemonadePrice(2.00);
    game.setAdvertising('radio');
    game.simulateDay();

    // Get the final game state
    const gameState = game.getState();
    console.log('Game State:', gameState);

    // Generate and verify proof
    const { verifyGameState } = useGroth16Proof();
    const { onVerifyProof } = useZkVerify();

    try {
        // Convert game state to circuit input format
        const dailyStates = gameState.salesHistory.map(day => ({
            money: day.revenue,
            lemons: gameState.inventory.lemons,
            sugar: gameState.inventory.sugar,
            ice: gameState.inventory.ice
        }));

        const dailyRecipes = gameState.salesHistory.map(() => ({
            lemonsPerCup: 2,
            sugarPerCup: 1,
            icePerCup: 3
        }));

        const dailyPrices = gameState.salesHistory.map(() => gameState.prices.lemonade);
        
        // Convert weather strings to numbers
        const weatherMap: { [key: string]: number } = {
            'Sunny': 0,
            'Hot': 1,
            'Cloudy': 2,
            'Rainy': 3
        };
        const dailyWeather = gameState.salesHistory.map(day => weatherMap[day.weather]);

        // Convert advertising types to numbers
        const advertisingMap: { [key: string]: number } = {
            'none': 0,
            'flyers': 1,
            'social': 2,
            'radio': 3
        };
        const dailyAdvertising = gameState.salesHistory.map(day => 
            advertisingMap[gameState.advertising.type]
        );

        // Generate and verify the proof
        const { proof, publicSignals, isValid } = await verifyGameState(
            dailyStates,
            dailyRecipes,
            dailyPrices,
            dailyWeather,
            dailyAdvertising,
            gameState.finalScore || 0,
            20.00 // Starting money
        );

        console.log('Proof generated:', isValid);
        console.log('Public Signals:', publicSignals);

        // Import verification key
        const vkModule = await import('../circuits/groth16/build/lemonade_new_verification_key.json');
        const vk = {
            protocol: vkModule.default.protocol,
            curve: vkModule.default.curve,
            nPublic: vkModule.default.nPublic,
            vk_alpha_1: vkModule.default.vk_alpha_1,
            vk_beta_2: vkModule.default.vk_beta_2[0],
            vk_gamma_2: vkModule.default.vk_gamma_2[0],
            vk_delta_2: vkModule.default.vk_delta_2[0],
            IC: vkModule.default.IC
        };

        // Send proof to zkVerify
        await onVerifyProof(proof, publicSignals, vk);
        console.log('Proof verified and submitted to zkVerify');

    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the test
testProofGeneration(); 