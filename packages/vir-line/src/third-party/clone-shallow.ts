import {kindOf} from './kind-of.js';
/** Since this is external code, I don't care about testing code coverage on it. */
/* c8 ignore start */

/**
 * Make a shallow copy of a variable.
 *
 * This is copied from `shallow-clone/index.js` from the [`shallow-clone` npm
 * package](https://www.npmjs.com/package/shallow-clone/v/3.0.1) and modified to be compatible with
 * ESM and TS.
 *
 * The original code contains the following license:
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2015-present, Jon Schlinkert.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
 * NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// eslint-disable-next-line @typescript-eslint/unbound-method
const valueOf = Symbol.prototype.valueOf;

export function cloneShallow(value: any) {
    switch (kindOf(value)) {
        case 'array':
            return value.slice();
        case 'object':
            return Object.assign({}, value);
        case 'date':
            return new value.constructor(Number(value));
        case 'map':
            return new Map(value);
        case 'set':
            return new Set(value);
        case 'buffer':
            return cloneBuffer(value);
        case 'symbol':
            return cloneSymbol(value);
        case 'arraybuffer':
            return cloneArrayBuffer(value);
        case 'float32array':
        case 'float64array':
        case 'int16array':
        case 'int32array':
        case 'int8array':
        case 'uint16array':
        case 'uint32array':
        case 'uint8clampedarray':
        case 'uint8array':
            return cloneTypedArray(value);
        case 'regexp':
            return cloneRegExp(value);
        case 'error':
            return Object.create(value);
        default: {
            return value;
        }
    }
}

function cloneRegExp(value: any) {
    // eslint-disable-next-line sonarjs/slow-regex
    const flags = value.flags === void 0 ? /\w+$/.exec(value) || void 0 : value.flags;
    const re = new value.constructor(value.source, flags);
    re.lastIndex = value.lastIndex;
    return re;
}

function cloneArrayBuffer(value: any) {
    const res = new value.constructor(value.byteLength);
    new Uint8Array(res).set(new Uint8Array(value));
    return res;
}

function cloneTypedArray(value: any) {
    return new value.constructor(value.buffer, value.byteOffset, value.length);
}

function cloneBuffer(value: any) {
    const len = value.length;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const buf = Buffer.allocUnsafe ? Buffer.allocUnsafe(len) : Buffer.from(len);
    value.copy(buf);
    return buf;
}

function cloneSymbol(value: any) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return valueOf ? new Object(valueOf.call(value)) : {};
}
