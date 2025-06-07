import React, { useState, forwardRef, useEffect } from 'react';
import { useAccount } from '@/context/AccountContext';
import dynamic from 'next/dynamic';
import styles from './ConnectWalletButton.module.css';
import { isMobile } from '@/utils/device';
import { connectToWallet, WalletConnectionResult } from '@/utils/walletConnect';

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
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
    const [selectedWalletType, setSelectedWalletType] = useState<'talisman' | 'subwallet' | null>(null);

    const handleWalletConnectOpen = () => {
        if (isMobile() && !selectedAccount) {
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

    const handleMobileWalletSelect = async (walletType: 'talisman' | 'subwallet') => {
        try {
            setConnectionStatus('connecting');
            setSelectedWalletType(walletType);
            setShowMobileOptions(false);

            const result = await connectToWallet(walletType);
            
            setConnectionStatus('connected');
            setSelectedAccount(result.address);
            setSelectedWallet(result.wallet);
        } catch (error) {
            console.error('Wallet connection error:', error);
            setConnectionStatus('error');
            // If connection failed, show mobile options again after a delay
            setTimeout(() => {
                setShowMobileOptions(true);
            }, 1000);
        }
    };

    const getButtonText = () => {
        if (selectedAccount) {
            return `Connected: ${selectedAccount.slice(0, 6)}...${selectedAccount.slice(-4)}`;
        }
        switch (connectionStatus) {
            case 'connecting':
                return `Connecting to ${selectedWalletType === 'talisman' ? 'Talisman' : 'SubWallet'}...`;
            case 'connected':
                return 'Connected!';
            case 'error':
                return 'Connection Failed - Try Again';
            default:
                return 'Connect Wallet';
        }
    };

    if (selectedAccount) {
        return (
            <div className={styles.connectedContainer}>
                <span className={styles.accountAddress}>
                    {`${selectedAccount.slice(0, 6)}...${selectedAccount.slice(-4)}`}
                </span>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <button
                onClick={handleWalletConnectOpen}
                className={`${styles.connectButton} ${connectionStatus === 'error' ? styles.error : ''}`}
                disabled={connectionStatus === 'connecting'}
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

            {showMobileOptions && !selectedAccount && (
                <div className={styles.mobileOptions}>
                    <button onClick={() => handleMobileWalletSelect('talisman')}>
                        Connect with Talisman
                    </button>
                    <button onClick={() => handleMobileWalletSelect('subwallet')}>
                        Connect with SubWallet
                    </button>
                </div>
            )}
        </div>
    );
});

ConnectWalletButton.displayName = 'ConnectWalletButton';
export default ConnectWalletButton;
