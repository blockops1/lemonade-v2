import { ApiPromise, WsProvider } from '@polkadot/api';

let api: ApiPromise | null = null;

export const initPolkadotAPI = async (): Promise<ApiPromise | null> => {
  if (typeof window === 'undefined') return null;

  if (!api) {
    try {
      const wsProvider = new WsProvider('wss://rpc.polkadot.io');
      api = await ApiPromise.create({ provider: wsProvider });
    } catch (error) {
      console.error('Failed to initialize Polkadot API:', error);
      return null;
    }
  }

  return api;
}; 