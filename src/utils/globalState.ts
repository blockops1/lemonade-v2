let globalProofUrl: string = 'https://zkverify-testnet.subscan.io/';
let listeners: Array<() => void> = [];

export const setGlobalProofUrl = (url: string) => {
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