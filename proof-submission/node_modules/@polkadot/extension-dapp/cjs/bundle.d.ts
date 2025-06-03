import type { InjectedAccountWithMeta, InjectedExtension, InjectedProviderWithMeta, ProviderList, Unsubcall, Web3AccountsOptions } from '@polkadot/extension-inject/types';
export { packageInfo } from './packageInfo.js';
export { unwrapBytes, wrapBytes } from './wrapBytes.js';
declare let isWeb3Injected: boolean;
declare let web3EnablePromise: Promise<InjectedExtension[]> | null;
export { isWeb3Injected, web3EnablePromise };
/**
 * @summary Enables all the providers found on the injected window interface
 * @description
 * Enables all injected extensions that has been found on the page. This
 * should be called before making use of any other web3* functions.
 */
export declare function web3Enable(originName: string, compatInits?: (() => Promise<boolean>)[]): Promise<InjectedExtension[]>;
/**
 * @summary Retrieves all the accounts across all providers
 * @description
 * This returns the full list of account available (across all extensions) to
 * the page. Filtering options are available of a per-extension, per type and
 * per-genesisHash basis. Optionally the accounts can be encoded with the provided
 * ss58Format
 */
export declare function web3Accounts({ accountType, extensions, genesisHash, ss58Format }?: Web3AccountsOptions): Promise<InjectedAccountWithMeta[]>;
/**
 * @summary Subscribes to all the accounts across all providers
 * @description
 * This is the subscription version of the web3Accounts interface with
 * updates as to when new accounts do become available. The list of filtering
 * options are the same as for the web3Accounts interface.
 */
export declare function web3AccountsSubscribe(cb: (accounts: InjectedAccountWithMeta[]) => void | Promise<void>, { accountType, extensions, genesisHash, ss58Format }?: Web3AccountsOptions): Promise<Unsubcall>;
/**
 * @summary Finds a specific provider based on the name
 * @description
 * This retrieves a specific source (extension) based on the name. In most
 * cases it should not be needed to call it directly (e.g. it is used internally
 * by calls such as web3FromAddress) but would allow operation on a specific
 * known extension.
 */
export declare function web3FromSource(source: string): Promise<InjectedExtension>;
/**
 * @summary Find a specific provider that provides a specific address
 * @description
 * Based on an address, return the provider that has makes this address
 * available to the page.
 */
export declare function web3FromAddress(address: string): Promise<InjectedExtension>;
/**
 * @summary List all providers exposed by one source
 * @description
 * For extensions that supply RPC providers, this call would return the list
 * of RPC providers that any extension may supply.
 */
export declare function web3ListRpcProviders(source: string): Promise<ProviderList | null>;
/**
 * @summary Start an RPC provider provider by a specific source
 * @description
 * For extensions that supply RPC providers, this call would return an
 * enabled provider (initialized with the specific key) from the
 * specified extension source.
 */
export declare function web3UseRpcProvider(source: string, key: string): Promise<InjectedProviderWithMeta>;
