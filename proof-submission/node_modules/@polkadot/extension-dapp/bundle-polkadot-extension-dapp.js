(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@polkadot/util'), require('@polkadot/util-crypto')) :
    typeof define === 'function' && define.amd ? define(['exports', '@polkadot/util', '@polkadot/util-crypto'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.polkadotExtensionDapp = {}, global.polkadotUtil, global.polkadotUtilCrypto));
})(this, (function (exports, util, utilCrypto) { 'use strict';

    const global = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : window;

    var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
    function documentReadyPromise(creator) {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve(creator());
            }
            else {
                window.addEventListener('load', () => resolve(creator()));
            }
        });
    }

    const packageInfo = { name: '@polkadot/extension-dapp', path: (({ url: (typeof document === 'undefined' && typeof location === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : typeof document === 'undefined' ? location.href : (_documentCurrentScript && _documentCurrentScript.src || new URL('bundle-polkadot-extension-dapp.js', document.baseURI).href)) }) && (typeof document === 'undefined' && typeof location === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : typeof document === 'undefined' ? location.href : (_documentCurrentScript && _documentCurrentScript.src || new URL('bundle-polkadot-extension-dapp.js', document.baseURI).href))) ? new URL((typeof document === 'undefined' && typeof location === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : typeof document === 'undefined' ? location.href : (_documentCurrentScript && _documentCurrentScript.src || new URL('bundle-polkadot-extension-dapp.js', document.baseURI).href))).pathname.substring(0, new URL((typeof document === 'undefined' && typeof location === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : typeof document === 'undefined' ? location.href : (_documentCurrentScript && _documentCurrentScript.src || new URL('bundle-polkadot-extension-dapp.js', document.baseURI).href))).pathname.lastIndexOf('/') + 1) : 'auto', type: 'esm', version: '0.58.8' };

    const unwrapBytes = util.u8aUnwrapBytes;
    const wrapBytes = util.u8aWrapBytes;

    const win = window;
    win.injectedWeb3 = win.injectedWeb3 || {};
    exports.isWeb3Injected = web3IsInjected();
    exports.web3EnablePromise = null;
    function web3IsInjected() {
        return Object
            .values(win.injectedWeb3)
            .filter(({ connect, enable }) => !!(connect || enable))
            .length !== 0;
    }
    function throwError(method) {
        throw new Error(`${method}: web3Enable(originName) needs to be called before ${method}`);
    }
    function mapAccounts(source, list, ss58Format) {
        return list.map(({ address, genesisHash, name, type }) => ({
            address: address.length === 42
                ? address
                : utilCrypto.encodeAddress(utilCrypto.decodeAddress(address), ss58Format),
            meta: { genesisHash, name, source },
            type
        }));
    }
    function filterAccounts(list, genesisHash, type) {
        return list.filter((a) => (!a.type || !type || type.includes(a.type)) &&
            (!a.genesisHash || !genesisHash || a.genesisHash === genesisHash));
    }
    function getWindowExtensions(originName) {
        return Promise
            .all(Object
            .entries(win.injectedWeb3)
            .map(([nameOrHash, { connect, enable, version }]) => Promise
            .resolve()
            .then(() => connect
            ? connect(originName)
            : enable
                ? enable(originName).then((e) => util.objectSpread({ name: nameOrHash, version: version || 'unknown' }, e))
                : Promise.reject(new Error('No connect(..) or enable(...) hook found')))
            .catch(({ message }) => {
            console.error(`Error initializing ${nameOrHash}: ${message}`);
        })))
            .then((exts) => exts.filter((e) => !!e));
    }
    async function filterEnable(caller, extensions) {
        if (!exports.web3EnablePromise) {
            return throwError(caller);
        }
        const sources = await exports.web3EnablePromise;
        return sources.filter(({ name }) => !extensions ||
            extensions.includes(name));
    }
    function web3Enable(originName, compatInits = []) {
        if (!originName) {
            throw new Error('You must pass a name for your app to the web3Enable function');
        }
        const initCompat = compatInits.length
            ? Promise.all(compatInits.map((c) => c().catch(() => false)))
            : Promise.resolve([true]);
        exports.web3EnablePromise = documentReadyPromise(() => initCompat.then(() => getWindowExtensions(originName)
            .then((values) => values.map((e) => {
            if (!e.accounts.subscribe) {
                e.accounts.subscribe = (cb) => {
                    e.accounts
                        .get()
                        .then(cb)
                        .catch(console.error);
                    return () => {
                    };
                };
            }
            return e;
        }))
            .catch(() => [])
            .then((values) => {
            const names = values.map(({ name, version }) => `${name}/${version}`);
            exports.isWeb3Injected = web3IsInjected();
            console.info(`web3Enable: Enabled ${values.length} extension${values.length !== 1 ? 's' : ''}: ${names.join(', ')}`);
            return values;
        })));
        return exports.web3EnablePromise;
    }
    async function web3Accounts({ accountType, extensions, genesisHash, ss58Format } = {}) {
        const accounts = [];
        const sources = await filterEnable('web3Accounts', extensions);
        const retrieved = await Promise.all(sources.map(async ({ accounts, name: source }) => {
            try {
                const list = await accounts.get();
                return mapAccounts(source, filterAccounts(list, genesisHash, accountType), ss58Format);
            }
            catch {
                return [];
            }
        }));
        retrieved.forEach((result) => {
            accounts.push(...result);
        });
        console.info(`web3Accounts: Found ${accounts.length} address${accounts.length !== 1 ? 'es' : ''}`);
        return accounts;
    }
    async function web3AccountsSubscribe(cb, { accountType, extensions, genesisHash, ss58Format } = {}) {
        const sources = await filterEnable('web3AccountsSubscribe', extensions);
        const accounts = {};
        const triggerUpdate = () => cb(Object
            .entries(accounts)
            .reduce((result, [source, list]) => {
            result.push(...mapAccounts(source, filterAccounts(list, genesisHash, accountType), ss58Format));
            return result;
        }, []));
        const unsubs = sources.map(({ accounts: { subscribe }, name: source }) => subscribe((result) => {
            accounts[source] = result;
            try {
                const result = triggerUpdate();
                if (result && util.isPromise(result)) {
                    result.catch(console.error);
                }
            }
            catch (error) {
                console.error(error);
            }
        }));
        return () => {
            unsubs.forEach((unsub) => {
                unsub();
            });
        };
    }
    async function web3FromSource(source) {
        if (!exports.web3EnablePromise) {
            return throwError('web3FromSource');
        }
        const sources = await exports.web3EnablePromise;
        const found = source && sources.find(({ name }) => name === source);
        if (!found) {
            throw new Error(`web3FromSource: Unable to find an injected ${source}`);
        }
        return found;
    }
    async function web3FromAddress(address) {
        if (!exports.web3EnablePromise) {
            return throwError('web3FromAddress');
        }
        const accounts = await web3Accounts();
        let found;
        if (address) {
            const accountU8a = utilCrypto.decodeAddress(address);
            found = accounts.find((account) => util.u8aEq(utilCrypto.decodeAddress(account.address), accountU8a));
        }
        if (!found) {
            throw new Error(`web3FromAddress: Unable to find injected ${address}`);
        }
        return web3FromSource(found.meta.source);
    }
    async function web3ListRpcProviders(source) {
        const { provider } = await web3FromSource(source);
        if (!provider) {
            console.warn(`Extension ${source} does not expose any provider`);
            return null;
        }
        return provider.listProviders();
    }
    async function web3UseRpcProvider(source, key) {
        const { provider } = await web3FromSource(source);
        if (!provider) {
            throw new Error(`Extension ${source} does not expose any provider`);
        }
        const meta = await provider.startProvider(key);
        return { meta, provider };
    }

    exports.packageInfo = packageInfo;
    exports.unwrapBytes = unwrapBytes;
    exports.web3Accounts = web3Accounts;
    exports.web3AccountsSubscribe = web3AccountsSubscribe;
    exports.web3Enable = web3Enable;
    exports.web3FromAddress = web3FromAddress;
    exports.web3FromSource = web3FromSource;
    exports.web3ListRpcProviders = web3ListRpcProviders;
    exports.web3UseRpcProvider = web3UseRpcProvider;
    exports.wrapBytes = wrapBytes;

}));
