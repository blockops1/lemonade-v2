import { isMobile, isIOS } from '@/utils/device';

// Deep links for different wallets
export const WALLET_DEEP_LINKS = {
  talisman: {
    // Talisman uses a specific format for deep linking
    deepLink: (returnUrl: string) => {
      const params = new URLSearchParams({
        app: 'LemonadeV2',
        returnUrl: returnUrl,
        action: 'connect',
        network: 'polkadot'
      });
      return `talisman://connect?${params.toString()}`;
    },
    appStore: 'https://apps.apple.com/us/app/talisman-wallet/id6443798348',
    playStore: 'https://play.google.com/store/apps/details?id=co.talisman.mobile'
  },
  subwallet: {
    // SubWallet uses a different format for deep linking
    deepLink: (returnUrl: string) => {
      const params = new URLSearchParams({
        app: 'LemonadeV2',
        returnUrl: returnUrl,
        action: 'connect',
        network: 'polkadot',
        dappUrl: window.location.origin
      });
      return `subwallet://connect?${params.toString()}`;
    },
    appStore: 'https://apps.apple.com/us/app/subwallet/id1633050280',
    playStore: 'https://play.google.com/store/apps/details?id=app.subwallet.mobile'
  }
};

export const connectToMobileWallet = async (walletType: 'talisman' | 'subwallet') => {
  const currentUrl = window.location.href;
  const returnUrl = encodeURIComponent(currentUrl);

  if (walletType === 'talisman') {
    const deepLink = `talisman://wc?app=lemonade&returnUrl=${returnUrl}&action=connect&network=volta`;
    window.location.href = deepLink;

    // For iOS, we need to handle the case where the app isn't installed
    if (isIOS()) {
      setTimeout(() => {
        // If we're still on the same page after 2 seconds, the app probably isn't installed
        if (document.visibilityState === 'visible') {
          window.location.href = 'https://apps.apple.com/app/talisman-wallet/id1623455061';
        }
      }, 2000);
    }
  } else if (walletType === 'subwallet') {
    const deepLink = `subwallet://wc?app=lemonade&returnUrl=${returnUrl}&action=connect&network=volta&dappUrl=${encodeURIComponent(window.location.origin)}`;
    window.location.href = deepLink;

    // For iOS, we need to handle the case where the app isn't installed
    if (isIOS()) {
      setTimeout(() => {
        // If we're still on the same page after 2 seconds, the app probably isn't installed
        if (document.visibilityState === 'visible') {
          window.location.href = 'https://apps.apple.com/app/subwallet/id1633059480';
        }
      }, 2000);
    }
  }
}; 