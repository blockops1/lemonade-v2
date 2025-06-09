'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './ProofDecoder.module.css';
import { decodeProof, decodeManualProof, parseHexToNumber } from '@/utils/proofDecoder';

interface DecodedProof {
  startingMoney: number;
  finalMoney: number;
  daysPlayed: number;
  verificationStatus: boolean;
}

function ProofDecoderContent() {
  const searchParams = useSearchParams();
  const [decodedProof, setDecodedProof] = useState<DecodedProof | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockExplorerUrl, setBlockExplorerUrl] = useState<string>('');
  const [manualInput, setManualInput] = useState<string>('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');
  const [extrinsicId, setExtrinsicId] = useState<string>('');

  useEffect(() => {
    const fetchProof = async () => {
      try {
        // Check if we're on the client side and searchParams is available
        if (typeof window === 'undefined' || !searchParams) {
          setError('Invalid search parameters');
          setLoading(false);
          return;
        }

        const extrinsicId = searchParams.get('extrinsic');
        if (!extrinsicId) {
          setError('No proof extrinsic ID provided');
          setLoading(false);
          return;
        }

        // Set the block explorer URL
        const url = `https://zkverify-testnet.subscan.io/extrinsic/${extrinsicId}`;
        setBlockExplorerUrl(url);

        // Try to decode the proof
        try {
          const proof = await decodeProof(extrinsicId);
          setDecodedProof(proof);
        } catch (err) {
          console.log('Automatic decoding failed, showing manual input option');
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to decode proof');
        setLoading(false);
      }
    };

    fetchProof();
  }, [searchParams]);

  const handleManualDecode = () => {
    try {
      const proof = decodeManualProof(manualInput);
      setDecodedProof(proof);
      setError(null);
    } catch (err) {
      setError('Failed to decode proof data. Please check the format.');
    }
  };

  const handleCopyParameters = async () => {
    try {
      setCopyStatus('copying');
      
      // Check if we're on the client side and searchParams is available
      if (typeof window === 'undefined' || !searchParams) {
        throw new Error('Invalid search parameters');
      }

      // Get the extrinsic ID from the URL parameters
      const extrinsicId = searchParams.get('extrinsic');
      if (!extrinsicId) {
        throw new Error('No extrinsic ID found in URL');
      }

      // Fetch the parameters through our API route
      const response = await fetch(`/api/proof?extrinsicId=${extrinsicId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch proof data');
      }

      const data = await response.json();
      console.log('Received data from API:', data);

      if (!data.data?.parameters) {
        throw new Error('No parameters found in the response');
      }

      // Format the parameters as a pretty-printed JSON string
      const parametersJson = JSON.stringify(data.data.parameters, null, 2);
      console.log('Copying parameters:', parametersJson);

      // Copy to clipboard
      await navigator.clipboard.writeText(parametersJson);
      
      setCopyStatus('success');
      setTimeout(() => setCopyStatus('idle'), 2000); // Reset status after 2 seconds
    } catch (err) {
      console.error('Error copying parameters:', err);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000); // Reset status after 2 seconds
    }
  };

  const handleExtrinsicIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extrinsicId) return;

    try {
      console.log('Fetching proof data for extrinsic:', extrinsicId);
      
      // Fetch the proof data through our API route
      const response = await fetch(`/api/proof?extrinsicId=${extrinsicId}`);
      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch proof data');
      }
      
      const data = await response.json();
      console.log('Raw API Response:', data);
      console.log('Data structure:', {
        hasData: !!data.data,
        hasParameters: !!data.data?.parameters,
        parametersLength: data.data?.parameters?.length,
        parameters: data.data?.parameters
      });

      if (!data.data?.parameters) {
        console.error('Missing data structure:', data);
        throw new Error('No proof data found');
      }

      // Find the public inputs array
      const pubsParam = data.data.parameters.find((param: any) => param.name === 'pubs');
      console.log('Found pubs parameter:', pubsParam);
      
      if (!pubsParam?.value || !Array.isArray(pubsParam.value)) {
        console.error('Invalid pubs parameter:', pubsParam);
        throw new Error('No public inputs found in proof');
      }

      console.log('Public inputs array:', pubsParam.value);

      // The public inputs are in order:
      // [0] - starting money (in cents)
      // [1] - final money (in cents)
      // [2] - days played
      // [3] - verification status (0 = false, 1 = true)
      const [startingMoney, finalMoney, daysPlayed, verificationStatus] = pubsParam.value.map(parseHexToNumber);

      console.log('Decoded values:', {
        startingMoney,
        finalMoney,
        daysPlayed,
        verificationStatus
      });

      // Convert verification status to boolean (7 = true, 0 = false)
      const isVerified = verificationStatus === 7;
      console.log('Verification status:', { raw: verificationStatus, boolean: isVerified });

      const proof: DecodedProof = {
        startingMoney,
        finalMoney,
        daysPlayed,
        verificationStatus: isVerified
      };

      console.log('Final proof object:', proof);
      setDecodedProof(proof);
      setError(null);
    } catch (error) {
      console.error('Error in handleExtrinsicIdSubmit:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch proof data');
      setDecodedProof(null);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Proof Decoder</h1>
      
      {loading && (
        <div className={styles.loading}>
          Loading proof data...
        </div>
      )}

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {!loading && (
        <div className={styles.proofDetails}>
          <div className={styles.blockExplorerSection}>
            <h2>Block Explorer Link</h2>
            <a 
              href={blockExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.blockExplorerLink}
            >
              View on Block Explorer
            </a>
            <button 
              onClick={handleCopyParameters}
              className={`${styles.copyButton} ${styles[copyStatus]}`}
              disabled={copyStatus === 'copying'}
            >
              {copyStatus === 'copying' && 'Copying...'}
              {copyStatus === 'success' && '✓ Copied!'}
              {copyStatus === 'error' && '✗ Failed to copy'}
              {copyStatus === 'idle' && 'Copy Proof Verification Parameters'}
            </button>
          </div>

          <div className={styles.manualInputSection}>
            <h2>Verify Your Game Proof - Paste the Parameters in the Field Below to Decode and Verify</h2>
            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Paste your Proof Verification Parameters here..."
              className={styles.manualInput}
              rows={10}
            />
            <button 
              onClick={handleManualDecode}
              className={styles.decodeButton}
            >
              Decode Proof
            </button>
          </div>

          {decodedProof && (
            <>
              <div className={styles.proofSection}>
                <h3>Game State</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Starting Money:</span>
                    <span className={styles.value}>${(decodedProof.startingMoney / 10).toFixed(2)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Final Money:</span>
                    <span className={styles.value}>${(decodedProof.finalMoney / 10).toFixed(2)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Days Played:</span>
                    <span className={styles.value}>{decodedProof.daysPlayed}</span>
                  </div>
                </div>
              </div>

              <div className={styles.verificationSection}>
                <h3>Verification Status</h3>
                <div className={`${styles.status} ${decodedProof.verificationStatus ? styles.verified : styles.failed}`}>
                  {decodedProof.verificationStatus ? '✓ Proof Verified' : '✗ Proof Verification Failed'}
                </div>
              </div>
            </>
          )}

          <div className={styles.instructions}>
            <h2>How to Verify Your Proof</h2>
            <ol className={styles.steps}>
              <li>
                <strong>Step 1:</strong> Click the "Copy Proof Verification Parameters" button above
              </li>
              <li>
                <strong>Step 2:</strong> Paste the copied parameters into the text field below
              </li>
              <li>
                <strong>Step 3:</strong> Click "Decode Proof" to verify your game results
              </li>
            </ol>
            <p className={styles.note}>
              Note: The verification will confirm your starting money, final money, and days played. Make sure the proof data is complete and properly formatted.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProofDecoder() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProofDecoderContent />
    </Suspense>
  );
} 