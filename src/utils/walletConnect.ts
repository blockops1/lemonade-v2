import { isMobile, isIOS } from '@/utils/device';
import { getWallets } from '@talismn/connect-wallets';

// Network configuration
const NETWORK_CONFIG = {
  name: 'zkVerify Testnet',
  rpcUrl: 'wss://testnet-rpc.zkverify.io',
  explorerUrl: 'https://zkverify-testnet.subscan.io/'
};

export interface WalletConnectionResult {
  address: string;
  wallet: 'talisman' | 'subwallet';
}

// Helper function for logging
const logWithSeparator = (title: string, data?: any) => {
  console.log('==================================================');
  console.log(`=== ${title} ===`);
  console.log('==================================================');
  if (data) {
    console.log(data);
    console.log('==================================================');
  }
};

// Initialize Talisman SDK
const initializeTalismanSDK = async () => {
  logWithSeparator('INITIALIZING TALISMAN SDK', { networkConfig: NETWORK_CONFIG });

  // Get all available wallets
  const wallets = await getWallets();
  
  logWithSeparator('TALISMAN SDK INITIALIZED', { 
    availableWallets: wallets.map(w => w.extensionName),
    networkConfig: NETWORK_CONFIG 
  });

  return wallets;
};

// Connect to wallet using Talisman SDK
export const connectToWallet = async (walletType: 'talisman' | 'subwallet'): Promise<WalletConnectionResult> => {
  logWithSeparator('WALLET CONNECTION STARTED', {
    walletType,
    isMobile: isMobile(),
    isIOS: isIOS(),
    userAgent: navigator.userAgent,
    networkConfig: NETWORK_CONFIG
  });

  try {
    // Initialize SDK and get available wallets
    const wallets = await initializeTalismanSDK();
    
    // For mobile SubWallet, we'll use deep linking
    if (walletType === 'subwallet' && isMobile()) {
      const returnUrl = encodeURIComponent(window.location.href);
      const rpcUrl = encodeURIComponent(NETWORK_CONFIG.rpcUrl);
      
      // Define all URL formats to try
      const urlFormats = [
        {
          name: 'Basic App Open',
          url: 'subwallet://',
          note: 'Just open the app'
        },
        {
          name: 'Basic WC',
          url: 'subwallet://wc',
          note: 'Open wallet connect'
        },
        {
          name: 'WC with App',
          url: `subwallet://wc?app=zkverify`,
          note: 'Wallet connect with app name'
        },
        {
          name: 'WC with Return',
          url: `subwallet://wc?returnUrl=${returnUrl}`,
          note: 'Wallet connect with return URL'
        },
        {
          name: 'WC with App and Return',
          url: `subwallet://wc?app=zkverify&returnUrl=${returnUrl}`,
          note: 'Wallet connect with app and return URL'
        },
        {
          name: 'WC with Network',
          url: `subwallet://wc?network=zkverify-testnet`,
          note: 'Wallet connect with network'
        },
        {
          name: 'WC with App and Network',
          url: `subwallet://wc?app=zkverify&network=zkverify-testnet`,
          note: 'Wallet connect with app and network'
        },
        {
          name: 'WC with RPC',
          url: `subwallet://wc?rpcUrl=${rpcUrl}`,
          note: 'Wallet connect with RPC URL'
        },
        {
          name: 'WC with App, Return, Network',
          url: `subwallet://wc?app=zkverify&returnUrl=${returnUrl}&network=zkverify-testnet`,
          note: 'Wallet connect with app, return URL, and network'
        },
        {
          name: 'Full Parameters',
          url: `subwallet://wc?app=zkverify&returnUrl=${returnUrl}&network=zkverify-testnet&rpcUrl=${rpcUrl}`,
          note: 'Wallet connect with all parameters'
        }
      ];

      logWithSeparator('SUBWALLET URL FORMATS', {
        totalFormats: urlFormats.length,
        formats: urlFormats.map(f => ({
          name: f.name,
          url: f.url,
          note: f.note
        }))
      });

      // Try each URL format in sequence
      let currentIndex = 0;
      const tryNextFormat = (): Promise<WalletConnectionResult> => {
        if (currentIndex >= urlFormats.length) {
          logWithSeparator('SUBWALLET ALL FORMATS TRIED', {
            note: 'All URL formats have been attempted'
          });
          return Promise.reject(new Error('All SubWallet URL formats failed'));
        }

        const format = urlFormats[currentIndex];
        logWithSeparator('SUBWALLET TRYING FORMAT', {
          index: currentIndex + 1,
          total: urlFormats.length,
          format: format.name,
          url: format.url,
          note: format.note
        });

        // Store the start time for connection tracking
        const connectionStartTime = Date.now();
        
        // Return a promise that will be resolved when the user returns from SubWallet
        return new Promise<WalletConnectionResult>((resolve, reject) => {
          const checkConnection = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const status = urlParams.get('status');
            const address = urlParams.get('address');
            const error = urlParams.get('error');
            const connectionTime = Date.now() - connectionStartTime;
            
            logWithSeparator('SUBWALLET CONNECTION CHECK', {
              format: format.name,
              timeElapsed: `${connectionTime}ms`,
              urlParams: Object.fromEntries(urlParams.entries()),
              status,
              address,
              error,
              currentUrl: window.location.href
            });
            
            if (status === 'success' && address) {
              logWithSeparator('SUBWALLET CONNECTION SUCCESS', {
                format: format.name,
                address,
                connectionTime: `${connectionTime}ms`,
                returnUrl: window.location.href
              });
              resolve({ address, wallet: 'subwallet' });
            } else if (status === 'error' || error) {
              const errorMessage = error || 'Unknown error';
              logWithSeparator('SUBWALLET CONNECTION ERROR', {
                format: format.name,
                error: errorMessage,
                connectionTime: `${connectionTime}ms`,
                returnUrl: window.location.href
              });
              // Try next format on error
              currentIndex++;
              tryNextFormat();
            } else {
              // Check if we've been waiting too long (5 seconds per format)
              if (connectionTime > 5000) {
                logWithSeparator('SUBWALLET FORMAT TIMEOUT', {
                  format: format.name,
                  connectionTime: `${connectionTime}ms`,
                  returnUrl: window.location.href,
                  note: 'Moving to next format after 5 seconds'
                });
                // Try next format on timeout
                currentIndex++;
                tryNextFormat();
              } else {
                setTimeout(checkConnection, 1000);
              }
            }
          };
          
          // Start checking for connection status
          checkConnection();
          
          // Navigate to SubWallet with current format
          window.location.href = format.url;
        });
      };

      // Start with the first format
      return tryNextFormat();
    }
    
    // For Talisman or desktop SubWallet, use the SDK
    const wallet = wallets.find(w => w.extensionName === walletType);
    
    logWithSeparator('WALLET STATUS', {
      found: !!wallet,
      details: wallet ? 'Found' : 'Not found',
      networkConfig: NETWORK_CONFIG
    });

    if (!wallet) {
      throw new Error(`${walletType} wallet not found`);
    }

    // Enable the wallet
    logWithSeparator('ENABLING WALLET', { wallet: walletType });
    await wallet.enable(NETWORK_CONFIG.name);
    
    // Get accounts
    logWithSeparator('GETTING ACCOUNTS', { wallet: walletType });
    const accounts = await wallet.getAccounts();
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    // Select the first account
    const selectedAccount = accounts[0];
    
    logWithSeparator('CONNECTION SUCCESSFUL', {
      wallet: walletType,
      address: selectedAccount.address,
      networkConfig: NETWORK_CONFIG
    });

    return {
      address: selectedAccount.address,
      wallet: walletType
    };
  } catch (error) {
    logWithSeparator('CONNECTION ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error',
      walletType,
      networkConfig: NETWORK_CONFIG
    });
    throw error;
  }
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
      logWithSeparator('TALISMAN DEEP LINK CONSTRUCTION', {
        app: 'LemonadeV2',
        returnUrl: returnUrl,
        network: NETWORK_CONFIG.name,
        encodedParams: params.toString(),
        finalLink: link,
        networkConfig: NETWORK_CONFIG
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
      logWithSeparator('SUBWALLET DEEP LINK CONSTRUCTION', {
        rawParams: {
          dappUrl: window.location.origin,
          returnUrl: returnUrl,
          action: 'connect',
          network: NETWORK_CONFIG.name,
          rpcUrl: NETWORK_CONFIG.rpcUrl,
          explorerUrl: NETWORK_CONFIG.explorerUrl
        },
        networkConfig: NETWORK_CONFIG
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
      logWithSeparator('SUBWALLET DEEP LINK ENCODED', {
        encodedParams: {
          dappUrl: window.location.origin,
          returnUrl: returnUrl,
          network: NETWORK_CONFIG.name,
          rpcUrl: NETWORK_CONFIG.rpcUrl,
          explorerUrl: NETWORK_CONFIG.explorerUrl
        },
        finalEncodedParams: params.toString(),
        finalLink: link,
        networkConfig: NETWORK_CONFIG
      });
      return link;
    },
    appStore: 'https://apps.apple.com/us/app/subwallet/id1633059480',
    playStore: 'https://play.google.com/store/apps/details?id=app.subwallet.mobile'
  }
};

export const connectToMobileWallet = async (walletType: 'talisman' | 'subwallet') => {
  logWithSeparator('WALLET CONNECTION STARTED', {
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
  logWithSeparator('URL CONFIGURATION', {
    currentUrl,
    returnUrl,
    origin: window.location.origin,
    pathname: window.location.pathname,
    search: window.location.search,
    networkConfig: NETWORK_CONFIG
  });

  // Check for any existing URL parameters that might indicate a return from wallet
  const urlParams = new URLSearchParams(window.location.search);
  logWithSeparator('URL PARAMETERS', {
    status: urlParams.get('status'),
    address: urlParams.get('address'),
    wallet: urlParams.get('wallet'),
    network: urlParams.get('network'),
    allParams: Object.fromEntries(urlParams.entries()),
    expectedNetwork: NETWORK_CONFIG.name
  });

  if (walletType === 'talisman') {
    try {
      // Initialize SDK and get available wallets
      const wallets = await initializeTalismanSDK();
      const talismanWallet = wallets.find(wallet => wallet.extensionName === 'talisman');
      
      logWithSeparator('TALISMAN WALLET STATUS', {
        found: !!talismanWallet,
        details: talismanWallet ? {
          name: talismanWallet.extensionName,
          installed: talismanWallet.installed
        } : 'Not found',
        networkConfig: NETWORK_CONFIG
      });
      
      if (talismanWallet) {
        try {
          logWithSeparator('TALISMAN WALLET ENABLING', {
            networkConfig: NETWORK_CONFIG
          });
          
          // Enable the wallet with the correct network
          await talismanWallet.enable('LemonadeV2');
          
          logWithSeparator('TALISMAN WALLET ENABLED', {
            networkConfig: NETWORK_CONFIG
          });
          
          // Get accounts with network information
          const accounts = await talismanWallet.getAccounts();
          logWithSeparator('TALISMAN ACCOUNTS', {
            accounts: accounts.map(acc => ({
              address: acc.address,
              name: acc.name,
              source: acc.source,
              network: NETWORK_CONFIG.name
            })),
            networkConfig: NETWORK_CONFIG
          });
          
          if (accounts && accounts.length > 0) {
            logWithSeparator('TALISMAN CONNECTION SUCCESSFUL', {
              address: accounts[0].address,
              network: NETWORK_CONFIG.name,
              networkConfig: NETWORK_CONFIG
            });
            return accounts[0].address;
          }
        } catch (error: any) {
          logWithSeparator('TALISMAN CONNECTION ERROR', {
            error: {
              name: error?.name,
              message: error?.message,
              stack: error?.stack
            },
            networkConfig: NETWORK_CONFIG
          });
          // Fallback to deep linking if SDK fails
          const deepLink = WALLET_DEEP_LINKS.talisman.deepLink(returnUrl);
          logWithSeparator('TALISMAN FALLBACK TO DEEP LINK', {
            deepLink,
            networkConfig: NETWORK_CONFIG
          });
          window.location.href = deepLink;
        }
      } else {
        // Fallback to deep linking if wallet not found
        const deepLink = WALLET_DEEP_LINKS.talisman.deepLink(returnUrl);
        logWithSeparator('TALISMAN WALLET NOT FOUND - USING DEEP LINK', {
          deepLink,
          networkConfig: NETWORK_CONFIG
        });
        window.location.href = deepLink;
      }
    } catch (error: any) {
      logWithSeparator('TALISMAN SDK INITIALIZATION ERROR', {
        error: {
          name: error?.name,
          message: error?.message,
          stack: error?.stack
        },
        networkConfig: NETWORK_CONFIG
      });
      // Fallback to deep linking if SDK initialization fails
      const deepLink = WALLET_DEEP_LINKS.talisman.deepLink(returnUrl);
      logWithSeparator('TALISMAN SDK INITIALIZATION FAILED - USING DEEP LINK', {
        deepLink,
        networkConfig: NETWORK_CONFIG
      });
      window.location.href = deepLink;
    }

    // For iOS, we need to handle the case where the app isn't installed
    if (isIOS()) {
      logWithSeparator('IOS DEVICE DETECTED', {
        networkConfig: NETWORK_CONFIG
      });
      setTimeout(() => {
        // If we're still on the same page after 2 seconds, the app probably isn't installed
        if (document.visibilityState === 'visible') {
          logWithSeparator('TALISMAN APP NOT DETECTED - REDIRECTING TO APP STORE', {
            networkConfig: NETWORK_CONFIG
          });
          window.location.href = WALLET_DEEP_LINKS.talisman.appStore;
        }
      }, 2000);
    }
  } else if (walletType === 'subwallet') {
    const deepLink = WALLET_DEEP_LINKS.subwallet.deepLink(returnUrl);
    logWithSeparator('SUBWALLET CONNECTION ATTEMPT', {
      deepLink,
      networkConfig: NETWORK_CONFIG
    });
    window.location.href = deepLink;

    // For iOS, we need to handle the case where the app isn't installed
    if (isIOS()) {
      logWithSeparator('IOS DEVICE DETECTED', {
        networkConfig: NETWORK_CONFIG
      });
      setTimeout(() => {
        // If we're still on the same page after 2 seconds, the app probably isn't installed
        if (document.visibilityState === 'visible') {
          logWithSeparator('SUBWALLET APP NOT DETECTED - REDIRECTING TO APP STORE', {
            networkConfig: NETWORK_CONFIG
          });
          window.location.href = WALLET_DEEP_LINKS.subwallet.appStore;
        }
      }, 2000);
    }
  }
}; 