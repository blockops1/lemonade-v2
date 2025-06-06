import { isMobile, isIOS } from '@/utils/device';

// Deep links for different wallets
export const WALLET_DEEP_LINKS = {
  talisman: {
    deepLink: 'talisman://connect?app=LemonadeV2',
    appStore: 'https://apps.apple.com/us/app/talisman-wallet/id6443798348',
    playStore: 'https://play.google.com/store/apps/details?id=co.talisman.mobile'
  },
  subwallet: {
    deepLink: 'subwallet://connect?app=LemonadeV2',
    appStore: 'https://apps.apple.com/us/app/subwallet/id1633050280',
    playStore: 'https://play.google.com/store/apps/details?id=app.subwallet.mobile'
  }
};

export const connectToMobileWallet = (walletType: 'talisman' | 'subwallet') => {
  if (!isMobile()) return;

  const wallet = WALLET_DEEP_LINKS[walletType];
  const startTime = Date.now();

  // For iOS, we need to handle the deep linking differently
  if (isIOS()) {
    // First try to open the app
    window.location.href = wallet.deepLink;

    // Wait longer on iOS before redirecting to app store
    setTimeout(() => {
      if (Date.now() - startTime < 2500) {
        // Check if we're still on the same page
        if (document.hidden) {
          // App was opened successfully
          return;
        }
        // If we're still here, the app didn't open
        window.location.href = wallet.appStore;
      }
    }, 2000);
  } else {
    // For Android, use the original logic
    window.location.href = wallet.deepLink;
    setTimeout(() => {
      if (Date.now() - startTime < 1500) {
        window.location.href = wallet.playStore;
      }
    }, 1000);
  }
}; 