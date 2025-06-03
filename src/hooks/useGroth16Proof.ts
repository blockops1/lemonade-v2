import { useState, useCallback } from 'react';
import { buildPoseidon } from 'circomlibjs';

interface GameState {
    money: number;
    lemons: number;
    sugar: number;
    ice: number;
}

interface DailyRecipe {
    lemonsPerCup: number;
    sugarPerCup: number;
    icePerCup: number;
}

interface GameProofInput {
    finalScore: number;
    daysPlayed: number;
    startingMoney: number;
    gameStateHash: string;
    dailyStates: number[][]; // [money, lemons, sugar, ice][]
    dailyRecipes: number[][]; // [lemonsPerCup, sugarPerCup, icePerCup][]
    dailyPrices: number[];
    dailyWeather: number[];
    dailyAdvertising: number[];
}

interface ProofOutput {
    proof: any;
    publicSignals: string[];
    isValid: boolean;
}

export const useGroth16Proof = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateGameStateHash = useCallback(async (states: GameState[]) => {
        try {
            const poseidon = await buildPoseidon();
            
            // Hash each state in pairs as per the circuit
            const intermediateHashes = await Promise.all(states.map(async state => {
                // First pair: money + lemons
                const pair1 = poseidon.F.toString(poseidon([
                    BigInt(Math.round(state.money)),
                    BigInt(state.lemons)
                ]));
                
                // Second pair: sugar + ice
                const pair2 = poseidon.F.toString(poseidon([
                    BigInt(state.sugar),
                    BigInt(state.ice)
                ]));
                
                // Hash the pairs together
                return poseidon.F.toString(poseidon([
                    BigInt(pair1),
                    BigInt(pair2)
                ]));
            }));

            // Final hash combining first and last intermediate hashes
            const finalHash = poseidon.F.toString(poseidon([
                BigInt(intermediateHashes[0]),
                BigInt(intermediateHashes[intermediateHashes.length - 1])
            ]));
            
            return finalHash;
        } catch (err) {
            console.error('Error generating game state hash:', err);
            throw err;
        }
    }, []);

    const generateProof = useCallback(async (input: GameProofInput): Promise<ProofOutput> => {
        setLoading(true);
        setError(null);

        try {
            // Import verification helpers dynamically
            const { generateProof, verifyProof } = await import('../circuits/groth16/build/verify.js');

            // Generate the proof
            const { proof, publicSignals } = await generateProof(input);

            // Verify the proof
            const isValid = await verifyProof(proof, publicSignals);

            setLoading(false);
            return { proof, publicSignals, isValid };
        } catch (err) {
            setLoading(false);
            setError(err instanceof Error ? err.message : 'Failed to generate proof');
            throw err;
        }
    }, []);

    const verifyGameState = useCallback(async (
        gameStates: GameState[],
        recipes: DailyRecipe[],
        prices: number[],
        weather: number[],
        advertising: number[],
        finalScore: number,
        startingMoney: number
    ): Promise<ProofOutput> => {
        try {
            // Round all money values
            const roundedGameStates = gameStates.map(state => ({
                ...state,
                money: Math.round(state.money)
            }));
            const roundedPrices = prices.map(price => Math.round(price));
            const roundedFinalScore = Math.round(finalScore);
            const roundedStartingMoney = Math.round(startingMoney);

            const gameStateHash = await generateGameStateHash(roundedGameStates);
            
            // Convert object arrays to number arrays for the circuit
            const circuitDailyStates = roundedGameStates.map(state => [
                state.money,
                state.lemons,
                state.sugar,
                state.ice
            ]);
            
            const circuitDailyRecipes = recipes.map(recipe => [
                recipe.lemonsPerCup,
                recipe.sugarPerCup,
                recipe.icePerCup
            ]);
            
            const input: GameProofInput = {
                finalScore: roundedFinalScore,
                daysPlayed: gameStates.length,
                startingMoney: roundedStartingMoney,
                gameStateHash,
                dailyStates: circuitDailyStates,
                dailyRecipes: circuitDailyRecipes,
                dailyPrices: roundedPrices,
                dailyWeather: weather,
                dailyAdvertising: advertising
            };

            return await generateProof(input);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to verify game state');
            throw err;
        }
    }, [generateProof, generateGameStateHash]);

    return {
        loading,
        error,
        verifyGameState,
        generateGameStateHash
    };
}; 