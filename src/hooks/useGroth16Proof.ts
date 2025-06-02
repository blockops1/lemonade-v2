import { useState, useCallback } from 'react';
import { groth16 } from 'snarkjs';

interface GameState {
  weatherCondition: number;
  advertisingLevel: number;
  pricePerCup: number;
  lemonsPerCup: number;
  sugarPerCup: number;
  icePerCup: number;
  inventory: [number, number, number];
}

interface ProofResult {
  isValid: boolean;
  expectedSales: number;
  expectedRevenue: number;
  proof: any;
  publicSignals: any;
}

export const useGroth16Proof = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateProof = useCallback(async (gameState: GameState): Promise<ProofResult | null> => {
    try {
      setLoading(true);
      setError(null);

      // Prepare input for the circuit
      const input = {
        weatherCondition: gameState.weatherCondition,
        advertisingLevel: gameState.advertisingLevel,
        pricePerCup: gameState.pricePerCup * 100, // Convert to cents
        lemonsPerCup: gameState.lemonsPerCup,
        sugarPerCup: gameState.sugarPerCup,
        icePerCup: gameState.icePerCup,
        inventory: gameState.inventory
      };

      // Generate the witness
      const { proof, publicSignals } = await groth16.fullProve(
        input,
        '/circuits/groth16/build/lemonade_js/lemonade.wasm',
        '/circuits/groth16/build/lemonade_final.zkey'
      );

      // Parse the public signals
      const [isValid, expectedSales, expectedRevenue] = publicSignals.map(Number);

      return {
        isValid: Boolean(isValid),
        expectedSales,
        expectedRevenue: expectedRevenue / 100, // Convert back from cents
        proof,
        publicSignals
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate proof');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    generateProof,
    loading,
    error
  };
}; 