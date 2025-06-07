import { useState } from 'react';
import { useGroth16Proof } from './useGroth16Proof';
import { useZkVerify, VerificationKey } from './useZkVerify';
import { useAccount } from '@/context/AccountContext';

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
  const { selectedAccount } = useAccount();

  const resetProofState = () => {
    setHasSubmittedProof(false);
    setError(null);
    setIsGenerating(false);
  };

  const generateAndVerifyProof = async (gameData: GameProofData) => {
    console.log('generateAndVerifyProof called with gameData:', {
      finalScore: gameData.finalScore,
      hasDailyStates: gameData.dailyStates.length > 0,
      hasDailyRecipes: gameData.dailyRecipes.length > 0
    });

    if (hasSubmittedProof) {
      console.log('Proof already submitted, returning early');
      setError('A proof has already been submitted for this game');
      return {
        success: false,
        error: 'A proof has already been submitted for this game'
      };
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log('Starting proof generation and verification');
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

      console.log('Proof generation result:', {
        isValid: proofResult.isValid,
        hasProof: !!proofResult.proof,
        hasPublicSignals: !!proofResult.publicSignals
      });

      if (!proofResult.isValid) {
        console.error('Generated proof is invalid');
        throw new Error('Generated proof is invalid');
      }

      // Import verification key
      console.log('Importing verification key');
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
      console.log('Sending proof to zkVerify');
      console.log('\n=== PROOF SUBMISSION DETAILS ===');
      console.log('Game data:', {
        finalScore: gameData.finalScore,
        type: typeof gameData.finalScore,
        value: gameData.finalScore,
        raw: gameData
      });
      
      // Ensure we have a valid score
      if (!gameData.finalScore) {
        console.error('No final score available in game data');
        throw new Error('No final score available');
      }

      console.log('Calling onVerifyProof with score:', gameData.finalScore);
      await onVerifyProof(
        JSON.stringify(proofResult.proof),
        proofResult.publicSignals,
        "0xc22f5b62480219ff00984575163c99cb32649bd903b041237cda7c16a4977c46", // Use the hardcoded hash
        gameData.finalScore
      );
      setHasSubmittedProof(true);

      return {
        success: true,
        proof: proofResult.proof,
        publicSignals: proofResult.publicSignals
      };
    } catch (err) {
      console.error('Error in generateAndVerifyProof:', err);
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
    isGenerating,
    error,
    hasSubmittedProof,
    status,
    eventData,
    transactionResult,
    generateAndVerifyProof,
    resetProofState
  };
}; 