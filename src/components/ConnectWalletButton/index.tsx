import React, { useState, forwardRef } from 'react';
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
        connectToMobileWallet(walletType);
        setShowMobileOptions(false);
    };

    return (
        <>
            <button
                onClick={handleWalletConnectOpen}
                className={`button ${styles.walletButton}`}
            >
                {selectedAccount
                    ? `Connected: ${selectedAccount.slice(0, 6)}...${selectedAccount.slice(-4)}`
                    : 'Connect Wallet'}
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

            {showMobileOptions && (
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
