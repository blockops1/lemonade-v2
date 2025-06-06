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
  window.location.href = wallet.deepLink;

  // If the app doesn't open within 1.5 seconds, redirect to app store
  setTimeout(() => {
    if (Date.now() - startTime < 1500) {
      window.location.href = isIOS() ? wallet.appStore : wallet.playStore;
    }
  }, 1000);
}; 