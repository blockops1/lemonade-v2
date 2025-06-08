let globalProofUrl: string | null = null;
let listeners: Array<() => void> = [];

// Global state for proof submission
let hasSubmittedProof = false;
const proofSubmissionListeners: (() => void)[] = [];

export const setGlobalProofUrl = (url: string | null) => {
    console.log('[GlobalState] Setting new proof URL:', url);
    globalProofUrl = url;
    // Notify all listeners
    console.log('[GlobalState] Notifying', listeners.length, 'listeners');
    listeners.forEach(listener => listener());
};

export const getGlobalProofUrl = () => {
    console.log('[GlobalState] Getting current proof URL:', globalProofUrl);
    return globalProofUrl;
};

export const subscribeToUrlChanges = (callback: () => void) => {
    console.log('[GlobalState] New subscription added');
    listeners.push(callback);
    // Return unsubscribe function
    return () => {
        console.log('[GlobalState] Removing subscription');
        listeners = listeners.filter(listener => listener !== callback);
    };
};

export function setGlobalProofSubmitted(submitted: boolean) {
  console.log('[GlobalState] Setting proof submission state:', submitted);
  hasSubmittedProof = submitted;
  proofSubmissionListeners.forEach(listener => listener());
}

export function getGlobalProofSubmitted() {
  console.log('[GlobalState] Getting current proof submission state:', hasSubmittedProof);
  return hasSubmittedProof;
}

export function subscribeToProofSubmission(callback: () => void) {
  console.log('[GlobalState] Adding proof submission listener');
  proofSubmissionListeners.push(callback);
  return () => {
    const index = proofSubmissionListeners.indexOf(callback);
    if (index > -1) {
      proofSubmissionListeners.splice(index, 1);
    }
  };
} 