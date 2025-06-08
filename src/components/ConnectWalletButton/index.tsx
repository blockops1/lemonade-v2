import React, { useState, forwardRef } from 'react';
import { useAccount } from '@/context/AccountContext';
import dynamic from 'next/dynamic';
import styles from './ConnectWalletButton.module.css';

const WalletSelect = dynamic(() =>
        import('@talismn/connect-components').then((mod) => mod.WalletSelect), {
        ssr: false,
    }
);

export interface ConnectWalletButtonHandle {
    openWalletModal: () => void;
    closeWalletModal: () => void;
}

interface Wallet {
    extensionName: string;
    title: string;
    installUrl: string;
}

interface Account {
    address: string;
    name?: string;
    source?: string;
    meta?: {
        name?: string;
    };
}

const ConnectWalletButton = forwardRef<ConnectWalletButtonHandle, { onWalletConnected: (rowIndex: number) => void }>(() => {
    const { selectedAccount, setSelectedAccount, setSelectedWallet } = useAccount();
    const [isWalletSelectOpen, setIsWalletSelectOpen] = useState(false);

    const handleWalletConnectOpen = () => {
        console.log('\n=== OPENING WALLET SELECTION ===');
        console.log('Current state:', { selectedAccount, isWalletSelectOpen });
        setIsWalletSelectOpen(true);
    };

    const handleWalletConnectClose = () => {
        console.log('\n=== CLOSING WALLET SELECTION ===');
        console.log('Current state:', { selectedAccount, isWalletSelectOpen });
        setIsWalletSelectOpen(false);
    };

    const handleWalletSelected = (wallet: Wallet) => {
        console.log('\n=== WALLET SELECTED ===');
        console.log('Selected wallet:', wallet.extensionName);
        setSelectedWallet(wallet.extensionName);
    };

    const handleUpdatedAccounts = (accounts: Account[] | undefined) => {
        console.log('\n=== ACCOUNTS UPDATED ===');
        console.log('Available accounts:', accounts?.map(a => ({ 
            address: a.address, 
            name: a.name || a.meta?.name || 'Unknown Account'
        })));
        
        if (accounts && accounts.length > 0) {
            console.log('Setting selected account:', accounts[0].address);
            setSelectedAccount(accounts[0].address);
        } else {
            console.log('No accounts available, clearing selection');
            setSelectedAccount(null);
            setIsWalletSelectOpen(true);
        }
    };

    const handleAccountSelected = (account: Account) => {
        console.log('\n=== ACCOUNT SELECTED ===');
        console.log('Selected account:', { 
            address: account.address, 
            name: account.name || account.meta?.name || 'Unknown Account'
        });
        setSelectedAccount(account.address);
        setIsWalletSelectOpen(false);
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

            {isWalletSelectOpen && (
                <WalletSelect
                    dappName="Lemonade Stand Game"
                    open={isWalletSelectOpen}
                    onWalletConnectClose={handleWalletConnectClose}
                    onWalletSelected={handleWalletSelected}
                    onUpdatedAccounts={handleUpdatedAccounts}
                    onAccountSelected={handleAccountSelected}
                    showAccountsList
                />
            )}
        </>
    );
});

ConnectWalletButton.displayName = 'ConnectWalletButton';
export default ConnectWalletButton;
