import { useState, useEffect } from 'react';
import { getGlobalProofUrl, subscribeToUrlChanges } from '@/utils/globalState';

export const useProofUrl = () => {
    const [url, setUrl] = useState(getGlobalProofUrl());

    useEffect(() => {
        const initialUrl = getGlobalProofUrl();
        console.log('[useProofUrl] Hook mounted, initial URL:', initialUrl);
        
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
    }, []); // Empty dependency array since we don't need any dependencies

    return url;
}; 