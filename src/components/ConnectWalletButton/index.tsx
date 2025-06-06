import React, { useState, forwardRef, useEffect } from 'react';
import { useAccount } from '@/context/AccountContext';
import dynamic from 'next/dynamic';
import styles from './ConnectWalletButton.module.css';
import { isMobile } from '@/utils/device';
import { connectToMobileWallet } from '@/utils/walletConnect';

const WalletSelect = dynamic(() =>
    import('@talismn/connect-components').then((mod) => mod.WalletSelect), {
    ssr: false,
}
);

export interface ConnectWalletButtonHandle {
    openWalletModal: () => void;
    closeWalletModal: () => void;
}

interface Account {
    address: string;
    name?: string;
    source?: string;
}

const ConnectWalletButton = forwardRef<ConnectWalletButtonHandle, { onWalletConnected: (rowIndex: number) => void }>(() => {
    const { selectedAccount, setSelectedAccount, setSelectedWallet } = useAccount();
    const [isWalletSelectOpen, setIsWalletSelectOpen] = useState(false);
    const [showMobileOptions, setShowMobileOptions] = useState(false);
    const [isDeepLinking, setIsDeepLinking] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');

    // Handle visibility change for deep linking
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                setIsDeepLinking(true);
                setConnectionStatus('connecting');
            } else if (document.visibilityState === 'visible' && isDeepLinking) {
                // Check URL parameters for connection status
                const urlParams = new URLSearchParams(window.location.search);
                const status = urlParams.get('status');
                const address = urlParams.get('address');
                const wallet = urlParams.get('wallet');

                if (status === 'success' && address) {
                    setConnectionStatus('connected');
                    setSelectedAccount(address);
                    if (wallet) {
                        setSelectedWallet(wallet);
                    }
                } else {
                    setConnectionStatus('error');
                }

                // Reset deep linking state after a delay
                setTimeout(() => {
                    setIsDeepLinking(false);
                    setShowMobileOptions(false);
                }, 1000);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isDeepLinking, setSelectedAccount, setSelectedWallet]);

    const handleWalletConnectOpen = () => {
        if (isMobile()) {
            setShowMobileOptions(true);
        } else {
            setIsWalletSelectOpen(true);
        }
    };

    const handleWalletConnectClose = () => {
        setIsWalletSelectOpen(false);
        setShowMobileOptions(false);
    };

    const handleWalletSelected = (wallet: { extensionName: string }) => {
        setSelectedWallet(wallet.extensionName);
    };

    const handleUpdatedAccounts = (accounts: Account[] | undefined) => {
        if (accounts && accounts.length > 0) {
            setSelectedAccount(accounts[0].address);
        } else {
            setSelectedAccount(null);
        }
    };

    const handleAccountSelected = (account: Account) => {
        setSelectedAccount(account.address);
    };

    const handleMobileWalletSelect = (walletType: 'talisman' | 'subwallet') => {
        setIsDeepLinking(true);
        setConnectionStatus('connecting');
        connectToMobileWallet(walletType);
    };

    const getButtonText = () => {
        if (selectedAccount) {
            return `Connected: ${selectedAccount.slice(0, 6)}...${selectedAccount.slice(-4)}`;
        }
        switch (connectionStatus) {
            case 'connecting':
                return 'Connecting...';
            case 'connected':
                return 'Connected!';
            case 'error':
                return 'Connection Failed - Try Again';
            default:
                return 'Connect Wallet';
        }
    };

    return (
        <>
            <button
                onClick={handleWalletConnectOpen}
                className={`button ${styles.walletButton} ${connectionStatus === 'error' ? styles.error : ''}`}
                disabled={isDeepLinking || connectionStatus === 'connecting'}
            >
                {getButtonText()}
            </button>

            {isWalletSelectOpen && !isMobile() && (
                <WalletSelect
                    dappName="LemonadeV2"
                    open={isWalletSelectOpen}
                    onWalletConnectOpen={handleWalletConnectOpen}
                    onWalletConnectClose={handleWalletConnectClose}
                    onWalletSelected={handleWalletSelected}
                    onUpdatedAccounts={handleUpdatedAccounts}
                    onAccountSelected={handleAccountSelected}
                    showAccountsList
                />
            )}

            {showMobileOptions && !isDeepLinking && (
                <div className={styles.mobileOptions}>
                    <button onClick={() => handleMobileWalletSelect('talisman')}>
                        Connect with Talisman
                    </button>
                    <button onClick={() => handleMobileWalletSelect('subwallet')}>
                        Connect with SubWallet
                    </button>
                </div>
            )}
        </>
    );
});

ConnectWalletButton.displayName = 'ConnectWalletButton';
export default ConnectWalletButton;
