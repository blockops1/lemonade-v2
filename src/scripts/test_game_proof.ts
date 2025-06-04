import { useGameProof } from '../hooks/useGameProof';

// Sample game data
const sampleGameData = {
  dailyStates: [
    [1500, 10, 5, 20],  // Day 1: money, lemons, sugar, ice
    [1800, 8, 4, 15],   // Day 2
    [2200, 12, 6, 25],  // Day 3
    [2500, 15, 7, 30],  // Day 4
    [2800, 18, 8, 35],  // Day 5
    [3000, 20, 10, 40], // Day 6
    [3500, 25, 12, 45]  // Day 7
  ],
  dailyRecipes: [
    [2, 1, 3],  // Day 1: lemons, sugar, ice per cup
    [2, 1, 3],  // Day 2
    [2, 1, 3],  // Day 3
    [2, 1, 3],  // Day 4
    [2, 1, 3],  // Day 5
    [2, 1, 3],  // Day 6
    [2, 1, 3]   // Day 7
  ],
  dailyPrices: [50, 50, 50, 50, 50, 50, 50],  // Price per cup in cents
  dailyWeather: [2, 2, 3, 2, 3, 2, 3],        // 0: rainy, 1: cloudy, 2: sunny, 3: hot
  dailyAdvertising: [0, 1, 1, 2, 2, 3, 3],    // 0: none, 1: flyers, 2: social, 3: radio
  finalScore: 3500,                            // Final money in cents
  startingMoney: 1200                          // Starting money in cents
};

async function testGameProof() {
  console.log('Starting game proof test...');
  
  try {
    const { generateAndVerifyProof } = useGameProof();
    
    console.log('Generating and verifying proof...');
    const result = await generateAndVerifyProof(sampleGameData);
    
    if (result.success) {
      console.log('Proof generated and verified successfully!');
      console.log('Proof:', result.proof);
      console.log('Verification Result:', result.verificationResult);
    } else {
      console.error('Failed to generate or verify proof:', result.error);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testGameProof().catch(console.error); 