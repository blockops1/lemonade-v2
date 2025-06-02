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
    dailyStates: GameState[];
    dailyRecipes: DailyRecipe[];
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
            const stateInputs = states.flatMap(state => [
                state.money,
                state.lemons,
                state.sugar,
                state.ice
            ]);
            return poseidon.F.toString(poseidon(stateInputs));
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
            const gameStateHash = await generateGameStateHash(gameStates);
            
            const input: GameProofInput = {
                finalScore,
                daysPlayed: gameStates.length,
                startingMoney,
                gameStateHash,
                dailyStates: gameStates,
                dailyRecipes: recipes,
                dailyPrices: prices,
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