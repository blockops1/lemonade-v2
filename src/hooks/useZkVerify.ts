import { useState } from 'react';
import { useAccount } from '@/context/AccountContext';
import { Library, CurveType, ZkVerifyEvents } from "zkverifyjs";

interface EventData {
    blockHash?: string;
    [key: string]: unknown;
}

interface TransactionResult {
    aggregationId?: number;
    blockHash?: string;
    txHash?: string;
    proofType?: string;
    domainId?: number;
    statement?: string | null;
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

            const proofData = proof;
            const { zkVerifySession } = await import('zkverifyjs');
            const session = await zkVerifySession.start().Volta().withWallet({
                source: selectedWallet,
                accountAddress: selectedAccount,
            });

            setStatus('verifying');
            setError(null);
            setTransactionResult(null);

            // First register the verification key if not already registered
            const { events: regEvents, transactionResult: regResult } = await session.registerVerificationKey()
                .groth16({ library: Library.snarkjs, curve: CurveType.bn128 })
                .execute(vk);

            let vkHash = '';
            
            // Wait for the verification key registration to be finalized
            await new Promise<void>((resolve, reject) => {
                regEvents.on(ZkVerifyEvents.Finalized, (eventData) => {
                    vkHash = eventData.statementHash;
                    resolve();
                });
                regEvents.on(ZkVerifyEvents.ErrorEvent, (error) => {
                    reject(new Error(error.message));
                });
            });

            // Now verify the proof using the registered verification key
            const { events, transactionResult } = await session
                .verify()
                .groth16({ library: Library.snarkjs, curve: CurveType.bn128 })
                .withRegisteredVk()
                .execute({
                    proofData: {
                        vk: vkHash,
                        proof: proofData,
                        publicSignals: publicSignals
                    },
                    domainId: 0
                });

            events.on(ZkVerifyEvents.IncludedInBlock, (data: EventData) => {
                setStatus('includedInBlock');
                setEventData(data);
            });

            let transactionInfo = null;
            try {
                transactionInfo = await transactionResult;
                // Cast the transaction info to match our interface
                setTransactionResult({
                    aggregationId: transactionInfo.aggregationId,
                    blockHash: transactionInfo.blockHash,
                    txHash: transactionInfo.txHash,
                    proofType: transactionInfo.proofType,
                    domainId: transactionInfo.domainId,
                    statement: transactionInfo.statement
                });
            } catch (error: unknown) {
                if (error instanceof Error && error.message.includes('Rejected by user')) {
                    setError('Transaction Rejected By User.');
                    setStatus('cancelled');
                    return;
                }
                throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            if (transactionInfo && transactionInfo.aggregationId) {
                setStatus('verified');
            } else {
                throw new Error("Your proof isn't correct.");
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            setStatus('error');
        }
    };

    return { status, eventData, transactionResult, error, onVerifyProof };
}
