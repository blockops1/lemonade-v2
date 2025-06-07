import { getWallets } from '@talismn/connect-wallets';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';

// Network configuration
const NETWORK = {
  name: 'ZkVerify Testnet',
  wsEndpoint: 'wss://zkverify-testnet.subscan.io',
  chainId: 'zkverify-testnet',
};

// Initialize Polkadot API
let api: ApiPromise | null = null;

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

// Connect to Talisman wallet
export async function connectTalismanWallet() {
  try {
    // Enable web3
    await web3Enable('Lemonade Stand Game');

    // Get all accounts
    const allAccounts = await web3Accounts();
    console.log('Available accounts:', allAccounts);

    if (allAccounts.length === 0) {
      throw new Error('No accounts found. Please create an account in Talisman wallet.');
    }

    // Get the first account
    const account = allAccounts[0];
    console.log('Selected account:', account);

    // Initialize API if not already initialized
    const api = await initializeApi();
    console.log('API initialized');

    return {
      address: account.address,
      name: account.meta.name || 'Talisman Account',
      api,
    };
  } catch (error) {
    console.error('Error connecting to Talisman wallet:', error);
    throw error;
  }
}

// Disconnect wallet
export function disconnectWallet() {
  api = null;
}

// Get current account
export async function getCurrentAccount() {
  try {
    const accounts = await web3Accounts();
    return accounts[0] || null;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
}

// Check if wallet is connected
export async function isWalletConnected() {
  try {
    const account = await getCurrentAccount();
    return !!account;
  } catch (error) {
    console.error('Error checking wallet connection:', error);
    return false;
  }
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