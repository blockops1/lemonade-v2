"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeriveJunction = void 0;
const util_1 = require("@polkadot/util");
const asU8a_js_1 = require("../blake2/asU8a.js");
const bn_js_1 = require("../bn.js");
const RE_NUMBER = /^\d+$/;
const JUNCTION_ID_LEN = 32;
class DeriveJunction {
    __internal__chainCode = new Uint8Array(32);
    __internal__isHard = false;
    static from(value) {
        const result = new DeriveJunction();
        const [code, isHard] = value.startsWith('/')
            ? [value.substring(1), true]
            : [value, false];
        result.soft(RE_NUMBER.test(code)
            ? new util_1.BN(code, 10)
            : code);
        return isHard
            ? result.harden()
            : result;
    }
    get chainCode() {
        return this.__internal__chainCode;
    }
    get isHard() {
        return this.__internal__isHard;
    }
    get isSoft() {
        return !this.__internal__isHard;
    }
    hard(value) {
        return this.soft(value).harden();
    }
    harden() {
        this.__internal__isHard = true;
        return this;
    }
    soft(value) {
        if ((0, util_1.isNumber)(value) || (0, util_1.isBn)(value) || (0, util_1.isBigInt)(value)) {
            return this.soft((0, util_1.bnToU8a)(value, bn_js_1.BN_LE_256_OPTS));
        }
        else if ((0, util_1.isHex)(value)) {
            return this.soft((0, util_1.hexToU8a)(value));
        }
        else if ((0, util_1.isString)(value)) {
            return this.soft((0, util_1.compactAddLength)((0, util_1.stringToU8a)(value)));
        }
        else if (value.length > JUNCTION_ID_LEN) {
            return this.soft((0, asU8a_js_1.blake2AsU8a)(value));
        }
        this.__internal__chainCode.fill(0);
        this.__internal__chainCode.set(value, 0);
        return this;
    }
    soften() {
        this.__internal__isHard = false;
        return this;
    }
}
exports.DeriveJunction = DeriveJunction;
