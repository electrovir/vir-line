/** Since this is external code, I don't care about testing code coverage on it. */
/* c8 ignore start */

/**
 * Get the type of a variable.
 *
 * This is copied from `kind-of/index.js` from the [`kind-of` npm
 * package](https://www.npmjs.com/package/kind-of/v/6.0.3) and modified to be compatible with ESM
 * and TS.
 *
 * The original code contains the following license:
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014-present, Jon Schlinkert.
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

var toString = Object.prototype.toString;

export function kindOf(value: unknown) {
    if (value === void 0) {
        return 'undefined';
    } else if (value === null) {
        return 'null';
    }

    const type = typeof value;
    if (type === 'boolean') {
        return 'boolean';
    } else if (type === 'string') {
        return 'string';
    } else if (type === 'number') {
        return 'number';
    } else if (type === 'symbol') {
        return 'symbol';
    } else if (type === 'function') {
        return isGeneratorFn(value) ? 'generatorfunction' : 'function';
    } else if (isArray(value)) {
        return 'array';
    } else if (isBuffer(value)) {
        return 'buffer';
    } else if (isArguments(value)) {
        return 'arguments';
    } else if (isDate(value)) {
        return 'date';
    } else if (isError(value)) {
        return 'error';
    } else if (isRegexp(value)) {
        return 'regexp';
    }

    switch (ctorName(value)) {
        case 'Symbol':
            return 'symbol';
        case 'Promise':
            return 'promise';

        // Set, Map, WeakSet, WeakMap
        case 'WeakMap':
            return 'weakmap';
        case 'WeakSet':
            return 'weakset';
        case 'Map':
            return 'map';
        case 'Set':
            return 'set';

        // 8-bit typed arrays
        case 'Int8Array':
            return 'int8array';
        case 'Uint8Array':
            return 'uint8array';
        case 'Uint8ClampedArray':
            return 'uint8clampedarray';

        // 16-bit typed arrays
        case 'Int16Array':
            return 'int16array';
        case 'Uint16Array':
            return 'uint16array';

        // 32-bit typed arrays
        case 'Int32Array':
            return 'int32array';
        case 'Uint32Array':
            return 'uint32array';
        case 'Float32Array':
            return 'float32array';
        case 'Float64Array':
            return 'float64array';
    }

    if (isGeneratorObj(value)) {
        return 'generator';
    }

    // Non-plain objects
    switch (toString.call(value)) {
        case '[object Object]':
            return 'object';
        // iterators
        case '[object Map Iterator]':
            return 'mapiterator';
        case '[object Set Iterator]':
            return 'setiterator';
        case '[object String Iterator]':
            return 'stringiterator';
        case '[object Array Iterator]':
            return 'arrayiterator';
    }

    // other
    return type.slice(8, -1).toLowerCase().replace(/\s/g, '');
}

function ctorName(value: any) {
    if (typeof value.constructor === 'function') {
        return value.constructor.name;
    } else {
        return null;
    }
}

function isArray(value: any) {
    if (Array.isArray) {
        return Array.isArray(value);
    } else {
        return value instanceof Array;
    }
}

function isError(value: any) {
    return (
        value instanceof Error ||
        (typeof value.message === 'string' &&
            value.constructor &&
            typeof value.constructor.stackTraceLimit === 'number')
    );
}

function isDate(value: any) {
    if (value instanceof Date) {
        return true;
    } else {
        return (
            typeof value.toDateString === 'function' &&
            typeof value.getDate === 'function' &&
            typeof value.setDate === 'function'
        );
    }
}

function isRegexp(value: any) {
    if (value instanceof RegExp) {
        return true;
    } else {
        return (
            typeof value.flags === 'string' &&
            typeof value.ignoreCase === 'boolean' &&
            typeof value.multiline === 'boolean' &&
            typeof value.global === 'boolean'
        );
    }
}

function isGeneratorFn(name: unknown) {
    return ctorName(name) === 'GeneratorFunction';
}

function isGeneratorObj(value: any) {
    return (
        typeof value.throw === 'function' &&
        typeof value.return === 'function' &&
        typeof value.next === 'function'
    );
}

function isArguments(value: any) {
    try {
        if (typeof value.length === 'number' && typeof value.callee === 'function') {
            return true;
        }
    } catch (error) {
        if ((error as any).message.indexOf('callee') !== -1) {
            return true;
        }
    }
    return false;
}

/**
 * If you need to support Safari 5-7 (8-10 yr-old browser), take a look at
 * https://github.com/feross/is-buffer
 */

function isBuffer(value: any) {
    if (value.constructor && typeof value.constructor.isBuffer === 'function') {
        return value.constructor.isBuffer(value);
    }
    return false;
}
