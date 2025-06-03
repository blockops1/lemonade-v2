import { stringToU8a, u8aToString } from '@polkadot/util';
import { Wbg } from './wbg.js';
/**
 * @name Bridge
 * @description
 * Creates a bridge between the JS and WASM environments.
 *
 * For any bridge it is passed an function which is then called internally at the
 * time of initialization. This affectively implements the layer between WASM and
 * the native environment, providing all the plumbing needed for the Wbg classes.
 */
export class Bridge {
    __internal__createWasm;
    __internal__heap;
    __internal__wbg;
    __internal__cachegetInt32;
    __internal__cachegetUint8;
    __internal__heapNext;
    __internal__wasm;
    __internal__wasmError;
    __internal__wasmPromise;
    __internal__type;
    constructor(createWasm) {
        this.__internal__createWasm = createWasm;
        this.__internal__cachegetInt32 = null;
        this.__internal__cachegetUint8 = null;
        this.__internal__heap = new Array(32)
            .fill(undefined)
            .concat(undefined, null, true, false);
        this.__internal__heapNext = this.__internal__heap.length;
        this.__internal__type = 'none';
        this.__internal__wasm = null;
        this.__internal__wasmError = null;
        this.__internal__wasmPromise = null;
        this.__internal__wbg = { ...new Wbg(this) };
    }
    /** @description Returns the init error */
    get error() {
        return this.__internal__wasmError;
    }
    /** @description Returns the init type */
    get type() {
        return this.__internal__type;
    }
    /** @description Returns the created wasm interface */
    get wasm() {
        return this.__internal__wasm;
    }
    /** @description Performs the wasm initialization */
    async init(createWasm) {
        if (!this.__internal__wasmPromise || createWasm) {
            this.__internal__wasmPromise = (createWasm || this.__internal__createWasm)(this.__internal__wbg);
        }
        const { error, type, wasm } = await this.__internal__wasmPromise;
        this.__internal__type = type;
        this.__internal__wasm = wasm;
        this.__internal__wasmError = error;
        return this.__internal__wasm;
    }
    /**
     * @internal
     * @description Gets an object from the heap
     */
    getObject(idx) {
        return this.__internal__heap[idx];
    }
    /**
     * @internal
     * @description Removes an object from the heap
     */
    dropObject(idx) {
        if (idx < 36) {
            return;
        }
        this.__internal__heap[idx] = this.__internal__heapNext;
        this.__internal__heapNext = idx;
    }
    /**
     * @internal
     * @description Retrieves and removes an object to the heap
     */
    takeObject(idx) {
        const ret = this.getObject(idx);
        this.dropObject(idx);
        return ret;
    }
    /**
     * @internal
     * @description Adds an object to the heap
     */
    addObject(obj) {
        if (this.__internal__heapNext === this.__internal__heap.length) {
            this.__internal__heap.push(this.__internal__heap.length + 1);
        }
        const idx = this.__internal__heapNext;
        this.__internal__heapNext = this.__internal__heap[idx];
        this.__internal__heap[idx] = obj;
        return idx;
    }
    /**
     * @internal
     * @description Retrieve an Int32 in the WASM interface
     */
    getInt32() {
        if (this.__internal__cachegetInt32 === null || this.__internal__cachegetInt32.buffer !== this.__internal__wasm.memory.buffer) {
            this.__internal__cachegetInt32 = new Int32Array(this.__internal__wasm.memory.buffer);
        }
        return this.__internal__cachegetInt32;
    }
    /**
     * @internal
     * @description Retrieve an Uint8Array in the WASM interface
     */
    getUint8() {
        if (this.__internal__cachegetUint8 === null || this.__internal__cachegetUint8.buffer !== this.__internal__wasm.memory.buffer) {
            this.__internal__cachegetUint8 = new Uint8Array(this.__internal__wasm.memory.buffer);
        }
        return this.__internal__cachegetUint8;
    }
    /**
     * @internal
     * @description Retrieves an Uint8Array in the WASM interface
     */
    getU8a(ptr, len) {
        return this.getUint8().subarray(ptr / 1, ptr / 1 + len);
    }
    /**
     * @internal
     * @description Retrieves a string in the WASM interface
     */
    getString(ptr, len) {
        return u8aToString(this.getU8a(ptr, len));
    }
    /**
     * @internal
     * @description Allocates an Uint8Array in the WASM interface
     */
    allocU8a(arg) {
        const ptr = this.__internal__wasm.__wbindgen_malloc(arg.length * 1);
        this.getUint8().set(arg, ptr / 1);
        return [ptr, arg.length];
    }
    /**
     * @internal
     * @description Allocates a string in the WASM interface
     */
    allocString(arg) {
        return this.allocU8a(stringToU8a(arg));
    }
    /**
     * @internal
     * @description Retrieves an Uint8Array from the WASM interface
     */
    resultU8a() {
        const r0 = this.getInt32()[8 / 4 + 0];
        const r1 = this.getInt32()[8 / 4 + 1];
        const ret = this.getU8a(r0, r1).slice();
        this.__internal__wasm.__wbindgen_free(r0, r1 * 1);
        return ret;
    }
    /**
     * @internal
     * @description Retrieve a string from the WASM interface
     */
    resultString() {
        return u8aToString(this.resultU8a());
    }
}
