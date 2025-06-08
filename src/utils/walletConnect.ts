import { getWallets } from '@talismn/connect-wallets';
import { ApiPromise } from '@polkadot/api/promise';
import { WsProvider } from '@polkadot/rpc-provider';

// Network configuration
const NETWORK = {
  name: 'ZkVerify Testnet',
  wsEndpoint: 'wss://zkverify-testnet.subscan.io',
  chainId: 'zkverify-testnet',
};

// Initialize Polkadot API
let api: ApiPromise | null = null;
let sessionId: string | null = null;
let walletType: string | null = null;

export async function initializeApi() {
  if (!api) {
    const provider = new WsProvider(NETWORK.wsEndpoint);
    api = await ApiPromise.create({ provider });
  }
  return api;
}

// Get available wallets
export function getAvailableWallets() {
  return getWallets().filter((wallet) => wallet.installed);
}

// Disconnect wallet
export function disconnectWallet() {
  api = null;
  sessionId = null;
  walletType = null;
}

// Get network information
export async function getNetworkInfo() {
  try {
    const api = await initializeApi();
    const [chain, nodeName, nodeVersion] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.system.name(),
      api.rpc.system.version(),
    ]);

    return {
      chain: chain.toString(),
      nodeName: nodeName.toString(),
      nodeVersion: nodeVersion.toString(),
    };
  } catch (error) {
    console.error('Error getting network info:', error);
    throw error;
  }
}

// Get current session info
export function getCurrentSession() {
  return {
    sessionId,
    walletType,
    hasApi: !!api
  };
} 