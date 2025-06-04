'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './ProofDecoder.module.css';
import { decodeProof, decodeManualProof } from '@/utils/proofDecoder';

interface DecodedProof {
  startingMoney: number;
  finalMoney: number;
  daysPlayed: number;
  verificationStatus: boolean;
}

export default function ProofDecoder() {
  const searchParams = useSearchParams();
  const [decodedProof, setDecodedProof] = useState<DecodedProof | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockExplorerUrl, setBlockExplorerUrl] = useState<string>('');
  const [manualInput, setManualInput] = useState<string>('');

  useEffect(() => {
    const fetchProof = async () => {
      try {
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
          </div>

          <div className={styles.manualInputSection}>
            <h2>Manual Proof Decoder</h2>
            <p>Paste the proof data from the block explorer below:</p>
            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Paste proof data here..."
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
        </div>
      )}
    </div>
  );
} 