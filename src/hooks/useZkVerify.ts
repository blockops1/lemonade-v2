import { useState, useEffect } from 'react';
import { useAccount } from '@/context/AccountContext';
import { zkVerifySession, Library, CurveType, ZkVerifyEvents } from "zkverifyjs";
import { setGlobalProofUrl, getGlobalProofUrl, subscribeToUrlChanges } from '@/utils/globalState';

interface EventData {
    blockHash?: string;
    transactionHash?: string;
    [key: string]: unknown;
}

interface TransactionResult {
    aggregationId?: number;
    blockHash?: string;
    txHash?: string;
    proofType?: string;
    domainId?: number;
    statement?: string | null;
    success: boolean;
    error?: string;
}

export interface VerificationKey {
    protocol: string;
    curve: string;
    nPublic: number;
    vk_alpha_1: string[];
    vk_beta_2: string[];
    vk_gamma_2: string[];
    vk_delta_2: string[];
    IC: string[][];
}

export function useZkVerify() {
    const { selectedAccount, selectedWallet } = useAccount();
    const [status, setStatus] = useState<string | null>(null);
    const [eventData, setEventData] = useState<EventData | null>(null);
    const [transactionResult, setTransactionResult] = useState<TransactionResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [finalScore, setFinalScore] = useState<number | null>(null);

    // Subscribe to proof URL changes
    useEffect(() => {
        const unsubscribe = subscribeToUrlChanges(() => {
            const url = getGlobalProofUrl();
            if (url === null) {
                // Clear all state when proof URL is set to null
                setStatus(null);
                setEventData(null);
                setTransactionResult(null);
                setError(null);
                setFinalScore(null);
            }
        });
        return unsubscribe;
    }, []);

    const addToLeaderboard = async (score: number, proofUrl: string) => {
        console.log('Attempting to add score to leaderboard:', {
            score,
            proofUrl,
            selectedAccount
        });

        if (!selectedAccount) {
            console.error('No account selected for leaderboard entry');
            return;
        }

        try {
            console.log('Making POST request to /api/leaderboard');
            const response = await fetch('/api/leaderboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address: selectedAccount,
                    score,
                    proof_url: proofUrl,
                }),
            });

            console.log('Leaderboard API response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to add score to leaderboard:', errorData);
                throw new Error('Failed to add score to leaderboard');
            }

            const data = await response.json();
            console.log('Successfully added to leaderboard:', data);
        } catch (error) {
            console.error('Error adding to leaderboard:', error);
        }
    };

    const onVerifyProof = async (
        proof: string,
        publicSignals: string[],
        vk: string,
        score?: number
    ): Promise<void> => {
        try {
            if (!proof || !publicSignals || !vk) {
                throw new Error('Proof, public signals, or verification key is missing');
            }

            if (!selectedWallet || !selectedAccount) {
                console.error('Wallet connection check failed:', { selectedWallet, selectedAccount });
                throw new Error('Wallet or account is not selected');
            }

            // Set the score immediately when received
            if (score !== undefined) {
                console.log('Setting final score:', score);
                setFinalScore(score);
            }

            console.log('Starting proof verification with wallet:', {
                wallet: selectedWallet,
                account: selectedAccount,
                score,
                vk
            });

            setStatus('verifying');
            setError(null);
            setTransactionResult(null);

            // Parse the proof JSON
            const proofData = JSON.parse(proof);
            console.log('Parsed proof data:', proofData);

            // Start a new zkVerify session with the connected wallet
            console.log('Starting zkVerify session...');
            const session = await zkVerifySession.start()
                .Volta()
                .withWallet({
                    source: selectedWallet,
                    accountAddress: selectedAccount,
                });

            console.log('zkVerify session started successfully');

            // Log the verification key hash value
            console.log('\n=== VERIFICATION KEY HASH DETAILS ===');
            console.log('Raw vk value:', vk);
            console.log('vk type:', typeof vk);
            console.log('vk length:', vk.length);
            console.log('vk JSON:', JSON.stringify({ vk }, null, 2));

            // Log the score being passed
            console.log('\n=== SCORE DETAILS ===');
            console.log('Final score:', score);
            console.log('Score type:', typeof score);
            console.log('Score value:', score);

            // Now verify the proof using the registered verification key hash
            console.log('Starting proof verification...');
            const { events: verifyEvents, transactionResult: verifyResult } = await session
                .verify()
                .groth16({ library: Library.snarkjs, curve: CurveType.bn128 })
                .withRegisteredVk()
                .execute({
                    proofData: {
                        vk: "0xc22f5b62480219ff00984575163c99cb32649bd903b041237cda7c16a4977c46", // Use the hash from vkey.json
                        proof: proofData,
                        publicSignals
                    },
                    domainId: 0
                });

            console.log('Proof verification initiated');

            // Listen for verification events
            verifyEvents.on(ZkVerifyEvents.IncludedInBlock, async (data) => {
                console.log('Proof included in block:', data);
                const proofUrl = `https://zkverify-testnet.subscan.io/extrinsic/${data.txHash}`;
                console.log('View proof on zkVerify:', proofUrl);
                // Update global URL
                setGlobalProofUrl(proofUrl);
                setStatus('Proof included in block');
                setEventData({
                    blockHash: data.blockHash,
                    transactionHash: data.txHash
                });

                // Add to leaderboard if we have a score
                if (score !== undefined) {
                    console.log('Adding to leaderboard with score:', score);
                    await addToLeaderboard(score, proofUrl);
                } else {
                    console.warn('No score available for leaderboard entry');
                    console.log('Score details:', {
                        score,
                        type: typeof score,
                        value: score
                    });
                }
            });

            // Wait for verification to complete
            console.log('Waiting for verification result...');
            verifyEvents.on(ZkVerifyEvents.Finalized, (data) => {
                console.log('Verification completed:', data);
                setStatus('Proof verified');
                setTransactionResult(data);
            });

            verifyEvents.on('error', (error) => {
                console.error('Verification error:', error);
                setError(error.message);
                setStatus('Verification failed');
            });

        } catch (err) {
            console.error('Error in onVerifyProof:', err);
            setError(err instanceof Error ? err.message : 'Failed to verify proof');
            setStatus('Verification failed');
        }
    };

    return {
        status,
        eventData,
        transactionResult,
        error,
        onVerifyProof
    };
}
