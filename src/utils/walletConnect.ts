import { isMobile, isIOS } from '@/utils/device';
import { getWallets } from '@talismn/connect-wallets';

// Deep links for different wallets
export const WALLET_DEEP_LINKS = {
  talisman: {
    // Talisman uses a specific format for deep linking
    deepLink: (returnUrl: string) => {
      const params = new URLSearchParams({
        app: 'LemonadeV2',
        returnUrl: returnUrl
      });
      return `talisman://wc?${params.toString()}`;
    },
    appStore: 'https://apps.apple.com/us/app/talisman-wallet/id6443798348',
    playStore: 'https://play.google.com/store/apps/details?id=co.talisman.mobile'
  },
  subwallet: {
    // SubWallet uses a different format for deep linking
    deepLink: (returnUrl: string) => {
      // SubWallet expects a specific format with dappUrl and returnUrl
      const params = new URLSearchParams({
        dappUrl: window.location.origin,
        returnUrl: returnUrl,
        action: 'connect',
        network: 'volta'
      });
      return `subwallet://wc?${params.toString()}`;
    },
    appStore: 'https://apps.apple.com/us/app/subwallet/id1633059480',
    playStore: 'https://play.google.com/store/apps/details?id=app.subwallet.mobile'
  }
};

export const connectToMobileWallet = async (walletType: 'talisman' | 'subwallet') => {
  console.log('Starting mobile wallet connection:', { walletType });
  
  // Get the current URL and encode it for the return URL
  const currentUrl = window.location.href;
  // Only encode once, as the deep link function will handle any additional encoding needed
  const returnUrl = encodeURIComponent(currentUrl);
  console.log('Current URL:', currentUrl);
  console.log('Encoded return URL:', returnUrl);

  if (walletType === 'talisman') {
    // Use Talisman's official SDK for mobile connection
    const wallets = getWallets();
    const talismanWallet = wallets.find(wallet => wallet.extensionName === 'talisman');
    
    if (talismanWallet) {
      try {
        await talismanWallet.enable('LemonadeV2');
        const accounts = await talismanWallet.getAccounts();
        if (accounts && accounts.length > 0) {
          console.log('Connected to Talisman:', accounts[0].address);
          return accounts[0].address;
        }
      } catch (error) {
        console.error('Error connecting to Talisman:', error);
        // Fallback to deep linking if SDK fails
        const deepLink = WALLET_DEEP_LINKS.talisman.deepLink(returnUrl);
        console.log('Falling back to deep link:', deepLink);
        window.location.href = deepLink;
      }
    } else {
      // Fallback to deep linking if wallet not found
      const deepLink = WALLET_DEEP_LINKS.talisman.deepLink(returnUrl);
      console.log('Wallet not found, using deep link:', deepLink);
      window.location.href = deepLink;
    }

    // For iOS, we need to handle the case where the app isn't installed
    if (isIOS()) {
      console.log('iOS device detected, setting up app store fallback');
      setTimeout(() => {
        // If we're still on the same page after 2 seconds, the app probably isn't installed
        if (document.visibilityState === 'visible') {
          console.log('App not detected, redirecting to App Store');
          window.location.href = WALLET_DEEP_LINKS.talisman.appStore;
        }
      }, 2000);
    }
  } else if (walletType === 'subwallet') {
    const deepLink = WALLET_DEEP_LINKS.subwallet.deepLink(returnUrl);
    console.log('SubWallet deep link:', deepLink);
    window.location.href = deepLink;

    // For iOS, we need to handle the case where the app isn't installed
    if (isIOS()) {
      console.log('iOS device detected, setting up app store fallback');
      setTimeout(() => {
        // If we're still on the same page after 2 seconds, the app probably isn't installed
        if (document.visibilityState === 'visible') {
          console.log('App not detected, redirecting to App Store');
          window.location.href = WALLET_DEEP_LINKS.subwallet.appStore;
        }
      }, 2000);
    }
  }
}; 