import { useState, useEffect } from 'react';
import { getGlobalProofSubmitted, subscribeToProofSubmission } from '@/utils/globalState';

export function useProofSubmitted() {
  const [hasSubmittedProof, setHasSubmittedProof] = useState(getGlobalProofSubmitted());

  useEffect(() => {
    console.log('[useProofSubmitted] Setting up subscription');
    const unsubscribe = subscribeToProofSubmission(() => {
      console.log('[useProofSubmitted] State changed:', getGlobalProofSubmitted());
      setHasSubmittedProof(getGlobalProofSubmitted());
    });
    return unsubscribe;
  }, []);

  return hasSubmittedProof;
} 