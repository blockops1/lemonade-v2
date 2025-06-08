import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount } from '@/context/AccountContext';
import { zkVerifySession, Library, CurveType, ZkVerifyEvents } from "zkverifyjs";
import { setGlobalProofUrl, getGlobalProofUrl, subscribeToUrlChanges } from '@/utils/globalState';

interface EventData {
    blockHash?: string;
    txHash?: string;
    transactionHash?: string;
    status?: string;
    proofType?: string;
    domainId?: number;
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
    const [session, setSession] = useState<any>(null);
    const [isInitializing, setIsInitializing] = useState(false);
    const initializationAttempted = useRef<string>('');

    // Initialize session when wallet changes
    const initializeSession = useCallback(async () => {
        if (!selectedWallet || !selectedAccount) {
            console.log('Cannot initialize session: No wallet or account selected');
            return null;
        }

        if (isInitializing) {
            console.log('Session initialization already in progress');
            return null;
        }

        // Check if we've already attempted initialization for this wallet/account combination
        const currentWalletKey = `${selectedWallet}-${selectedAccount}`;
        if (initializationAttempted.current === currentWalletKey) {
            console.log('Session initialization already attempted for this wallet/account');
            return session;
        }

        try {
            setIsInitializing(true);
            console.log('Initializing new session for wallet:', selectedWallet);
            
            // Clear any existing session
            if (session) {
                console.log('Clearing existing session');
                setSession(null);
            }

            const newSession = await zkVerifySession.start()
                .Volta()
                .withWallet({
                    source: selectedWallet,
                    accountAddress: selectedAccount,
                });
            
            console.log('Session initialized successfully');
            setSession(newSession);
            initializationAttempted.current = currentWalletKey;
            return newSession;
        } catch (err) {
            console.error('Failed to initialize session:', err);
            setError(err instanceof Error ? err.message : 'Failed to initialize session');
            return null;
        } finally {
            setIsInitializing(false);
        }
    }, [selectedWallet, selectedAccount, session, isInitializing]);

    // Effect to handle wallet changes
    useEffect(() => {
        const currentWalletKey = selectedWallet && selectedAccount ? `${selectedWallet}-${selectedAccount}` : '';
        
        if (currentWalletKey && (!session || initializationAttempted.current !== currentWalletKey)) {
            console.log('Wallet changed, initializing new session');
            initializeSession();
        } else if (!currentWalletKey) {
            console.log('Wallet disconnected, clearing session');
            setSession(null);
            initializationAttempted.current = '';
        }
    }, [selectedWallet, selectedAccount, session, initializeSession]);

    // Subscribe to proof URL changes
    useEffect(() => {
        const unsubscribe = subscribeToUrlChanges(() => {
            const url = getGlobalProofUrl();
            if (url === null) {
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
        if (!selectedAccount) {
            console.error('No account selected for leaderboard entry');
            return;
        }

        try {
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
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error('Failed to add score to leaderboard');
            }
        } catch (error) {
            console.error('Error adding to leaderboard:', error);
        }
    };

    const onVerifyProof = async (
        proof: string,
        publicSignals: string[],
        vk: string,
        score?: number
    ): Promise<{ events: any }> => {
        try {
            if (!proof || !publicSignals || !vk) {
                throw new Error('Proof, public signals, or verification key is missing');
            }

            if (!selectedWallet || !selectedAccount) {
                throw new Error('Wallet or account is not selected');
            }

            // Set the score immediately when received
            if (score !== undefined) {
                setFinalScore(score);
            }

            setStatus('verifying');
            setError(null);
            setTransactionResult(null);

            // Parse the proof JSON
            const proofData = JSON.parse(proof);

            // Use existing session or create new one
            let currentSession = session;
            if (!currentSession) {
                console.log('No active session, creating new one');
                currentSession = await initializeSession();
                if (!currentSession) {
                    throw new Error('Failed to initialize session');
                }
            }

            // Verify the proof
            const { events: verifyEvents, transactionResult: verifyResult } = await currentSession
                .verify()
                .groth16({ library: Library.snarkjs, curve: CurveType.bn128 })
                .withRegisteredVk()
                .execute({
                    proofData: {
                        vk: "0xc22f5b62480219ff00984575163c99cb32649bd903b041237cda7c16a4977c46",
                        proof: proofData,
                        publicSignals
                    },
                    domainId: 0
                });

            // Listen for verification events
            verifyEvents.on(ZkVerifyEvents.IncludedInBlock, async (data: EventData) => {
                console.log('IncludedInBlock event data:', data);
                const txHash = data.txHash || data.transactionHash;
                if (!txHash) {
                    console.error('No transaction hash in IncludedInBlock event');
                    return;
                }
                const proofUrl = `https://zkverify-testnet.subscan.io/extrinsic/${txHash}`;
                console.log('Setting proof URL:', proofUrl);
                setGlobalProofUrl(proofUrl);
                setStatus('Proof included in block');
                setEventData({
                    blockHash: data.blockHash,
                    transactionHash: txHash
                });

                if (score !== undefined) {
                    await addToLeaderboard(score, proofUrl);
                }
            });

            verifyEvents.on(ZkVerifyEvents.Finalized, (data: TransactionResult) => {
                console.log('Finalized event data:', data);
                setStatus('Proof verified');
                setTransactionResult(data);
            });

            verifyEvents.on('error', (error: Error) => {
                console.error('Error event:', error);
                setError(error.message);
                setStatus('Verification failed');
            });

            return { events: verifyEvents };
        } catch (err) {
            console.error('Error in onVerifyProof:', err);
            setError(err instanceof Error ? err.message : 'Failed to verify proof');
            setStatus('Verification failed');
            throw err; // Re-throw to handle in the calling function
        }
    };

    return {
        status,
        eventData,
        transactionResult,
        error,
        onVerifyProof,
        isInitializing
    };
}
