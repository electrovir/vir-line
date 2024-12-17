import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {VirLineWithState} from './vir-line-with-state.js';
import {VirLine} from './vir-line.js';

describe('VirLineWithState', () => {
    it('is compatible with more complex VirLine instances', () => {
        function requiresBaseState(virLine: VirLineWithState<{a: string}>) {
            return virLine;
        }

        const virLine = new VirLine(
            [
                {
                    stageId: {
                        name: 'test',
                    },
                    executor({state}: {state: {a: string; b: number}}) {},
                },
            ],
            {a: 'hi', b: 5},
        );

        requiresBaseState(virLine);
    });

    it('is compatible with multi-stage VirLine instances', () => {
        function requiresBaseState(virLine: VirLineWithState<{a: string}>) {
            return virLine;
        }

        const virLine = new VirLine(
            [
                {
                    stageId: {
                        name: 'test',
                    },
                    executor({state}: {state: {a: string; b: number}}) {},
                },
                {
                    stageId: {
                        name: 'test 2',
                    },
                    executor({state}: {state: {q: RegExp; r: any[]}}) {},
                },
            ],
            {a: 'hi', b: 4, q: /hi/, r: []},
        );

        requiresBaseState(virLine);
    });

    it('rejects an incompatible VirLine instance', () => {
        function requiresBaseState(virLine: VirLineWithState<{zebra: string}>) {
            return virLine;
        }

        const virLine = new VirLine(
            [
                {
                    stageId: {
                        name: 'test',
                    },
                    executor({state}: {state: {a: string; b: number}}) {},
                },
                {
                    stageId: {
                        name: 'test 2',
                    },
                    executor({state}: {state: {q: undefined; r: string}}) {},
                },
            ],
            {a: 'hi', b: 5, q: undefined, r: 'hi'},
        );

        // @ts-expect-error: intentional type mismatch for testing purposes
        requiresBaseState(virLine);
    });

    it('has proper listenToState types', () => {
        const exampleVirLine = {listenToState() {}} as any as VirLineWithState<{
            a: {
                f: {
                    h: string;
                };
                g: number;
            };
            b: {
                d: {
                    e: string;
                };
            };
            // eslint-disable-next-line @typescript-eslint/no-empty-object-type
            c: {};
        }>;

        exampleVirLine.listenToState(false, {b: {d: true}}, (value) => {
            assert.tsType(value).equals<{e: string}>();
        });
    });
});
