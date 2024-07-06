/** Since this is external code, I don't care about testing code coverage on it. */
/* c8 ignore start */

import {AnyFunction} from '@augment-vir/common';
import {isPlainObject} from 'is-plain-object';
import {cloneShallow} from './clone-shallow';
import {kindOf} from './kind-of';

/**
 * Deeply copy a variable.
 *
 * This is copied from `clone-deep/index.js` from the [`clone-deep` npm
 * package](https://www.npmjs.com/package/clone-deep/v/4.0.1) and modified to be compatible with ESM
 * and TS.
 *
 * The original code contains the following license:
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014-2023, Jon Schlinkert.
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

export function cloneDeep(value: unknown, instanceClone?: AnyFunction) {
    switch (kindOf(value)) {
        case 'object':
            return cloneObjectDeep(value, instanceClone);
        case 'array':
            return cloneArrayDeep(value, instanceClone);
        default: {
            return cloneShallow(value);
        }
    }
}

function cloneObjectDeep(value: any, instanceClone?: AnyFunction) {
    if (typeof instanceClone === 'function') {
        return instanceClone(value);
    }
    if (instanceClone || isPlainObject(value)) {
        const res = new value.constructor();
        for (let key in value) {
            res[key] = cloneDeep(value[key], instanceClone);
        }
        return res;
    }
    return value;
}

function cloneArrayDeep(value: any, instanceClone?: AnyFunction) {
    const res = new value.constructor(value.length);
    for (let i = 0; i < value.length; i++) {
        res[i] = cloneDeep(value[i], instanceClone);
    }
    return res;
}
