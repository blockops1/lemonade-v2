import React from 'react';
import { WalletSelect } from '@talismn/connect-components';
import styles from './WalletConnectModal.module.css';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Connect Wallet</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          <WalletSelect dappName="Lemonade Game" />
        </div>
      </div>
    </div>
  );
}; 