import { isMobile, isIOS } from '@/utils/device';
import { getWallets } from '@talismn/connect-wallets';

// Network configuration
const NETWORK_CONFIG = {
  name: 'zkVerify Testnet',
  rpcUrl: 'wss://testnet-rpc.zkverify.io',
  explorerUrl: 'https://zkverify-testnet.subscan.io/'
};

// Deep links for different wallets
export const WALLET_DEEP_LINKS = {
  talisman: {
    // Talisman uses a specific format for deep linking
    deepLink: (returnUrl: string) => {
      const params = new URLSearchParams({
        app: 'LemonadeV2',
        returnUrl: returnUrl,
        network: NETWORK_CONFIG.name
      });
      const link = `talisman://wc?${params.toString()}`;
      console.log('Talisman deep link params:', {
        app: 'LemonadeV2',
        returnUrl: returnUrl,
        network: NETWORK_CONFIG.name,
        encodedParams: params.toString(),
        finalLink: link
      });
      return link;
    },
    appStore: 'https://apps.apple.com/us/app/talisman-wallet/id6443798348',
    playStore: 'https://play.google.com/store/apps/details?id=co.talisman.mobile'
  },
  subwallet: {
    // SubWallet uses a different format for deep linking
    deepLink: (returnUrl: string) => {
      // Log the raw parameters before encoding
      console.log('SubWallet deep link raw params:', {
        dappUrl: window.location.origin,
        returnUrl: returnUrl,
        action: 'connect',
        network: NETWORK_CONFIG.name,
        rpcUrl: NETWORK_CONFIG.rpcUrl,
        explorerUrl: NETWORK_CONFIG.explorerUrl
      });

      // Use URLSearchParams to handle encoding properly
      const params = new URLSearchParams();
      params.append('dappUrl', window.location.origin);
      params.append('returnUrl', returnUrl);
      params.append('action', 'connect');
      params.append('network', NETWORK_CONFIG.name);
      params.append('rpcUrl', NETWORK_CONFIG.rpcUrl);
      params.append('explorerUrl', NETWORK_CONFIG.explorerUrl);

      const link = `subwallet://wc?${params.toString()}`;
      console.log('SubWallet deep link encoded params:', {
        dappUrl: window.location.origin,
        returnUrl: returnUrl,
        network: NETWORK_CONFIG.name,
        rpcUrl: NETWORK_CONFIG.rpcUrl,
        explorerUrl: NETWORK_CONFIG.explorerUrl,
        encodedParams: params.toString(),
        finalLink: link
      });
      return link;
    },
    appStore: 'https://apps.apple.com/us/app/subwallet/id1633059480',
    playStore: 'https://play.google.com/store/apps/details?id=app.subwallet.mobile'
  }
};

export const connectToMobileWallet = async (walletType: 'talisman' | 'subwallet') => {
  console.log('Starting mobile wallet connection:', { 
    walletType,
    isMobile: isMobile(),
    isIOS: isIOS(),
    userAgent: navigator.userAgent,
    networkConfig: NETWORK_CONFIG
  });
  
  // Get the current URL and encode it for the return URL
  const currentUrl = window.location.href;
  // Don't encode the return URL here, let the deep link function handle it
  const returnUrl = currentUrl;
  console.log('URL details:', {
    currentUrl,
    returnUrl,
    origin: window.location.origin,
    pathname: window.location.pathname,
    search: window.location.search,
    networkConfig: NETWORK_CONFIG
  });

  // Check for any existing URL parameters that might indicate a return from wallet
  const urlParams = new URLSearchParams(window.location.search);
  console.log('Current URL parameters:', {
    status: urlParams.get('status'),
    address: urlParams.get('address'),
    wallet: urlParams.get('wallet'),
    network: urlParams.get('network'),
    allParams: Object.fromEntries(urlParams.entries())
  });

  if (walletType === 'talisman') {
    // Use Talisman's official SDK for mobile connection
    console.log('Initializing Talisman SDK...');
    try {
      const wallets = getWallets();
      console.log('SDK initialization successful');
      console.log('Available wallets:', wallets.map(w => ({
        name: w.extensionName,
        installed: w.installed
      })));
      
      const talismanWallet = wallets.find(wallet => wallet.extensionName === 'talisman');
      console.log('Talisman wallet details:', talismanWallet ? {
        name: talismanWallet.extensionName,
        installed: talismanWallet.installed
      } : 'Not found');
      
      if (talismanWallet) {
        try {
          console.log('Attempting to enable Talisman wallet...');
          await talismanWallet.enable('LemonadeV2');
          console.log('Talisman wallet enabled, getting accounts...');
          const accounts = await talismanWallet.getAccounts();
          console.log('Talisman accounts:', accounts);
          
          if (accounts && accounts.length > 0) {
            console.log('Connected to Talisman:', accounts[0].address);
            return accounts[0].address;
          }
        } catch (error: any) {
          console.error('Error connecting to Talisman:', error);
          console.log('Error details:', {
            name: error?.name,
            message: error?.message,
            stack: error?.stack
          });
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
    } catch (error: any) {
      console.error('Error initializing Talisman SDK:', error);
      console.log('Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      // Fallback to deep linking if SDK initialization fails
      const deepLink = WALLET_DEEP_LINKS.talisman.deepLink(returnUrl);
      console.log('SDK initialization failed, using deep link:', deepLink);
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