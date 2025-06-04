import { useState, useEffect } from 'react';
import { getGlobalProofUrl, subscribeToUrlChanges } from '@/utils/globalState';

export const useProofUrl = () => {
    const [url, setUrl] = useState(getGlobalProofUrl());

    useEffect(() => {
        console.log('[useProofUrl] Hook mounted, initial URL:', url);
        
        // Subscribe to URL changes
        const unsubscribe = subscribeToUrlChanges(() => {
            const newUrl = getGlobalProofUrl();
            console.log('[useProofUrl] URL changed:', newUrl);
            setUrl(newUrl);
        });

        // Cleanup subscription on unmount
        return () => {
            console.log('[useProofUrl] Hook unmounting, cleaning up subscription');
            unsubscribe();
        };
    }, []);

    return url;
}; 