import { useState } from 'react';
import { groth16 } from 'snarkjs';
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

export const useGroth16Proof = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateGameStateHash = async (states: GameState[]): Promise<number> => {
        try {
            console.log('\n=== GENERATING GAME STATE HASH ===');
            console.log('Input states:', states);
            
            const poseidon = await buildPoseidon();
            console.log('Poseidon hash function initialized');
            
            // Process states in chunks of 4 (one state at a time)
            let currentHash: any = null;
            for (const state of states) {
                const inputs = [state.money, state.lemons, state.sugar, state.ice];
                console.log('\nProcessing state:', {
                    state,
                    inputs,
                    currentHashType: currentHash ? typeof currentHash : 'null',
                    currentHashValue: currentHash
                });

                if (currentHash === null) {
                    currentHash = await poseidon(inputs);
                    console.log('Initial hash generated:', {
                        type: typeof currentHash,
                        value: currentHash
                    });
                } else {
                    // Combine previous hash with new state
                    const combinedInputs = [currentHash, ...inputs];
                    console.log('Combining with previous hash:', {
                        combinedInputs,
                        previousHashType: typeof currentHash,
                        previousHashValue: currentHash
                    });
                    currentHash = await poseidon(combinedInputs);
                    console.log('New combined hash:', {
                        type: typeof currentHash,
                        value: currentHash
                    });
                }
            }
            
            if (currentHash === null) {
                throw new Error('No states to hash');
            }

            // Convert Uint8Array to number
            if (currentHash instanceof Uint8Array) {
                console.log('Converting Uint8Array to number');
                // Take the first 4 bytes and convert to a 32-bit integer
                const view = new DataView(currentHash.buffer);
                currentHash = view.getUint32(0, true); // true for little-endian
                console.log('Converted hash value:', currentHash);
            }
            
            // Ensure it's a finite number
            if (!Number.isFinite(currentHash)) {
                console.error('Invalid hash value:', currentHash);
                throw new Error('Invalid hash value generated');
            }

            console.log('\nFinal hash value:', {
                type: typeof currentHash,
                value: currentHash,
                isFinite: Number.isFinite(currentHash)
            });
            
            return currentHash;
        } catch (err) {
            console.error('Error in generateGameStateHash:', err);
            throw new Error('Failed to generate game state hash');
        }
    };

    const generateProof = async (
        dailyStates: number[][],
        dailyRecipes: number[][],
        dailyPrices: number[],
        dailyWeather: number[],
        dailyAdvertising: number[],
        finalScore: number,
        startingMoney: number
    ) => {
        setLoading(true);
        setError(null);

        try {
            console.log('\n=== GENERATING PROOF ===');
            console.log('Input parameters:', {
                dailyStates,
                dailyRecipes,
                dailyPrices,
                dailyWeather,
                dailyAdvertising,
                finalScore,
                startingMoney
            });

            // Extract daily money, revenue, and ad costs from states
            const dailyMoney = dailyStates.map(state => state[0]);
            const dailyRevenue = dailyStates.map((state, i) => {
                const price = dailyPrices[i];
                const sales = Math.floor(state[1] / dailyRecipes[i][0]); // lemons / lemonsPerCup
                return sales * price;
            });
            const dailyAdCosts = dailyAdvertising.map(ad => {
                switch(ad) {
                    case 0: return 0;    // none
                    case 1: return 90;   // flyers
                    case 2: return 240;  // social
                    case 3: return 450;  // tv
                    default: return 0;
                }
            });

            console.log('\nExtracted daily values:', {
                dailyMoney,
                dailyRevenue,
                dailyAdCosts
            });

            // Prepare the input for the circuit
            const input = {
                startingMoney,
                finalMoney: finalScore,
                daysPlayed: dailyStates.length,
                dailyMoney,
                dailyRevenue,
                dailyAdCosts
            };

            console.log('\nCircuit input:', input);

            // Generate the proof
            const wasmPath = '/circuits/groth16/build/lemonade_basic_js/lemonade_basic.wasm';
            const zkeyPath = '/circuits/groth16/build/lemonade_basic_final.zkey';
            console.log('\nGenerating proof with files:', { wasmPath, zkeyPath });
            
            const { proof, publicSignals } = await groth16.fullProve(
                input,
                wasmPath,
                zkeyPath
            );

            console.log('\nProof generated successfully');
            return {
                proof,
                publicSignals
            };
        } catch (err) {
            console.error('Error in generateProof:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate proof');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const verifyGameState = async (
        gameStates: GameState[],
        recipes: DailyRecipe[],
        prices: number[],
        weather: number[],
        advertising: number[],
        finalScore: number,
        startingMoney: number
    ) => {
        setLoading(true);
        setError(null);

        try {
            const { proof, publicSignals } = await generateProof(
                gameStates.map(state => [state.money, state.lemons, state.sugar, state.ice]),
                recipes.map(recipe => [recipe.lemonsPerCup, recipe.sugarPerCup, recipe.icePerCup]),
                prices,
                weather,
                advertising,
                finalScore,
                startingMoney
            );

            console.log('\n=== VERIFYING PROOF ===');
            console.log('Loading verification key...');
            
            const response = await fetch('/circuits/groth16/build/lemonade_basic_verification_key.json');
            const verificationKey = await response.json();
            
            console.log('Verification key loaded:', verificationKey);
            console.log('Verifying proof with:', { proof, publicSignals });

            const isValid = await groth16.verify(verificationKey, publicSignals, proof);
            console.log('Verification result:', isValid);

            return {
                isValid,
                proof,
                publicSignals
            };
        } catch (err) {
            console.error('Error in verifyGameState:', err);
            setError(err instanceof Error ? err.message : 'Failed to verify game state');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        verifyGameState,
        generateGameStateHash,
        generateProof
    };
}; 