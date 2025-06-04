import { useState } from 'react';
import { useAccount } from '@/context/AccountContext';
import { zkVerifySession, Library, CurveType, ZkVerifyEvents } from "zkverifyjs";

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

    const onVerifyProof = async (
        proof: string,
        publicSignals: string[],
        vk: VerificationKey
    ): Promise<void> => {
        try {
            if (!proof || !publicSignals || !vk) {
                throw new Error('Proof, public signals, or verification key is missing');
            }

            if (!selectedWallet || !selectedAccount) {
                throw new Error('Wallet or account is not selected');
            }

            console.log('Starting proof verification with wallet:', {
                wallet: selectedWallet,
                account: selectedAccount
            });

            setStatus('verifying');
            setError(null);
            setTransactionResult(null);

            // Parse the proof JSON
            const proofData = JSON.parse(proof);
            console.log('Parsed proof data:', proofData);

            // Start a new zkVerify session with the connected wallet
            const session = await zkVerifySession.start()
                .Volta()
                .withWallet({
                    source: selectedWallet,
                    accountAddress: selectedAccount,
                });

            console.log('zkVerify session started');

            // Now verify the proof using the registered verification key hash
            console.log('Starting proof verification...');
            const { events: verifyEvents, transactionResult: verifyResult } = await session
                .verify()
                .groth16({ library: Library.snarkjs, curve: CurveType.bn128 })
                .withRegisteredVk()
                .execute({
                proofData: {
                        vk: vk,  // This should be the hash from vkey.json
                    proof: proofData,
                        publicSignals
                },
                domainId: 0
            });

            // Listen for verification events
            verifyEvents.on(ZkVerifyEvents.IncludedInBlock, (data) => {
                console.log('Proof included in block:', data);
                console.log('View proof on zkVerify:', `https://zkverify-testnet.subscan.io/extrinsic/${data.txHash}`);
                setStatus('Proof included in block');
                setEventData({
                    blockHash: data.blockHash,
                    transactionHash: data.txHash
                });
            });

            // Wait for verification to complete
            console.log('Waiting for verification result...');
            const result = await verifyResult;
            console.log('Verification completed:', result);
            
            setTransactionResult({
                success: true,
                ...result
            });
            } catch (error: unknown) {
            console.error('Error during proof verification:', error);
            
            if (error instanceof Error && error.message.includes('Rejected by user')) {
                    setError('Transaction Rejected By User.');
                    setStatus('cancelled');
                setTransactionResult({
                    success: false,
                    error: 'Transaction Rejected By User.'
                });
                    return;
                }

            const errorMessage = error instanceof Error ? error.message : 'Failed to verify proof';
            setError(errorMessage);
            setStatus('error');
            setTransactionResult({
                success: false,
                error: errorMessage
            });
        }
    };

    return { status, eventData, transactionResult, error, onVerifyProof };
}
