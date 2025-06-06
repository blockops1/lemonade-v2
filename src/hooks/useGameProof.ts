import { useState } from 'react';
import { useGroth16Proof } from './useGroth16Proof';
import { useZkVerify, VerificationKey } from './useZkVerify';

interface GameProofData {
  dailyStates: number[][];
  dailyRecipes: number[][];
  dailyPrices: number[];
  dailyWeather: number[];
  dailyAdvertising: number[];
  finalScore: number;
  startingMoney: number;
}

export const useGameProof = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmittedProof, setHasSubmittedProof] = useState(false);
  const { generateProof, verifyGameState } = useGroth16Proof();
  const { onVerifyProof, status, eventData, transactionResult } = useZkVerify();

  const generateAndVerifyProof = async (gameData: GameProofData) => {
    if (hasSubmittedProof) {
      setError('A proof has already been submitted for this game');
      return {
        success: false,
        error: 'A proof has already been submitted for this game'
      };
    }

    setIsGenerating(true);
    setError(null);

    try {
      // First, generate the proof locally
      const proofResult = await verifyGameState(
        gameData.dailyStates.map(state => ({
          money: state[0],
          lemons: state[1],
          sugar: state[2],
          ice: state[3]
        })),
        gameData.dailyRecipes.map(recipe => ({
          lemonsPerCup: recipe[0],
          sugarPerCup: recipe[1],
          icePerCup: recipe[2]
        })),
        gameData.dailyPrices,
        gameData.dailyWeather,
        gameData.dailyAdvertising,
        gameData.finalScore,
        gameData.startingMoney
      );

      if (!proofResult.isValid) {
        throw new Error('Generated proof is invalid');
      }

      // Import verification key
      const vkModule = await fetch('/circuits/groth16/build/lemonade_basic_verification_key.json').then(res => res.json());
      const vk: VerificationKey = {
        protocol: vkModule.protocol,
        curve: vkModule.curve,
        nPublic: vkModule.nPublic,
        vk_alpha_1: vkModule.vk_alpha_1,
        vk_beta_2: vkModule.vk_beta_2,
        vk_gamma_2: vkModule.vk_gamma_2,
        vk_delta_2: vkModule.vk_delta_2,
        IC: vkModule.IC
      };

      // Send proof to zkVerify
      await onVerifyProof(JSON.stringify(proofResult.proof), proofResult.publicSignals, vk);
      setHasSubmittedProof(true);

      return {
        success: true,
        proof: proofResult.proof,
        publicSignals: proofResult.publicSignals
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate or verify proof');
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to generate or verify proof'
      };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateAndVerifyProof,
    isGenerating,
    error,
    status,
    eventData,
    transactionResult,
    hasSubmittedProof
  };
}; 