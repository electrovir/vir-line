import {assert, waitUntil} from '@augment-vir/assert';
import {DeferredPromise, wait, type AnyObject, type MaybePromise} from '@augment-vir/common';
import {describe, it} from '@augment-vir/test';
import {type PartialDeep} from 'type-fest';
import {
    VirLineDestroyEvent,
    VirLineErrorEvent,
    VirLineUpdateRateEvent,
    VirLineUpdateSkippedEvent,
} from './events.js';
import type {VirLineOptions} from './options.js';
import {VirLineStage} from './stage.js';
import {StagesToFullState} from './state.js';
import {cloneDeep} from './third-party/clone-deep.js';
import {VirLine} from './vir-line.js';

describe(VirLine.name, () => {
    function withVirLine<const Stages extends ReadonlyArray<Readonly<VirLineStage<any>>>>(
        stages: Readonly<Stages>,
        startState: StagesToFullState<NoInfer<Stages>>,
        callback: (args: {virLine: VirLine<NoInfer<Stages>>}) => MaybePromise<void>,
        options?: Readonly<PartialDeep<VirLineOptions>>,
    ) {
        return async () => {
            const virLine = new VirLine(stages as any, startState, options);

            await callback({virLine} as any);

            virLine.destroy();
        };
    }

    it(
        'runs automatically and stops when destroyed',
        withVirLine(
            [
                new VirLineStage<{count: number}>(
                    {
                        name: 'incrementor',
                    },
                    ({state}) => {
                        state.count++;
                    },
                ),
            ],
            {
                count: 0,
            },
            async ({virLine}) => {
                await waitUntil.isTruthy(() => virLine.currentState.count > 5);

                virLine.destroy();
                const countAtDestruction = virLine.currentState.count;

                await wait({seconds: 2});

                assert.strictEquals(countAtDestruction, virLine.currentState.count);
            },
            {
                updateLoopInterval: {milliseconds: 1},
                init: {
                    startUpdateLoopImmediately: true,
                },
            },
        ),
    );

    it(
        'runs with default update interval',
        withVirLine(
            [
                new VirLineStage<{count: number}>(
                    {
                        name: 'incrementor',
                    },
                    ({state}) => {
                        state.count++;
                    },
                ),
            ],
            {
                count: 0,
            },
            async ({virLine}) => {
                virLine.startUpdateLoop();

                await waitUntil.isTruthy(() => virLine.currentState.count > 5);

                virLine.destroy();
            },
        ),
    );

    it(
        'calculates update rate',
        withVirLine(
            [],
            {},
            async ({virLine}) => {
                let updatesPerSecond = 0;

                virLine.listen(VirLineUpdateRateEvent, (event) => {
                    updatesPerSecond = event.detail.updatesPerSecond;
                });
                virLine.startUpdateLoop();

                await waitUntil.isTruthy(() => updatesPerSecond > 0);
            },
            {
                updateLoopInterval: {milliseconds: 1},
                minUpdateRateCalculationInterval: {milliseconds: 1},
            },
        ),
    );

    it(
        'does not calculate update rate if disabled',
        withVirLine(
            [],
            {},
            async ({virLine}) => {
                let updatesPerSecond = 0;

                virLine.listen(VirLineUpdateRateEvent, (event) => {
                    updatesPerSecond = event.detail.updatesPerSecond;
                });
                virLine.startUpdateLoop();

                await wait({seconds: 2});

                virLine.destroy();
                assert.strictEquals(updatesPerSecond, 0);
            },
            {
                updateLoopInterval: {milliseconds: 1},
                minUpdateRateCalculationInterval: undefined,
            },
        ),
    );

    it(
        'emits an error event if a stage errors',
        withVirLine(
            [
                new VirLineStage(
                    {
                        name: 'intentional failure',
                    },
                    () => {
                        throw new Error('FAIL');
                    },
                ),
            ],
            {},
            async ({virLine}) => {
                let error: Error | undefined;

                virLine.listen(VirLineErrorEvent, (event) => {
                    error = event.detail;
                });
                await virLine.triggerUpdate();

                await waitUntil.isTruthy(() => error);

                assert.strictEquals(error?.message, "Stage 'intentional failure' failed: FAIL");
            },
        ),
    );

    it(
        'supports state listeners',
        withVirLine(
            [
                new VirLineStage<{value: {nested: string}; count: number}>(
                    {
                        name: 'count then update',
                    },
                    ({state}) => {
                        state.count++;
                        if (state.count > 10) {
                            state.value.nested = 'finished';
                        } else if (state.count > 20) {
                            state.value.nested = 'over finished';
                        }
                    },
                ),
            ],
            {
                value: {nested: 'started'},
                count: 0,
            },
            async ({virLine}) => {
                let updatedValue = '';

                const unListen = virLine.listenToState(
                    false,
                    {
                        value: {
                            nested: true,
                        },
                    },
                    (newNested) => {
                        updatedValue = newNested;
                    },
                );

                await waitUntil.isTruthy(async () => {
                    await virLine.triggerUpdate();
                    return updatedValue;
                });
                assert.strictEquals(updatedValue, 'finished');

                assert.isTrue(unListen());
                assert.isFalse(unListen());

                await waitUntil.isTruthy(async () => {
                    await virLine.triggerUpdate();

                    return virLine.currentState.count > 25;
                });

                assert.strictEquals(updatedValue, 'finished');
            },
        ),
    );

    it(
        'state listeners work even across mutations',
        withVirLine(
            [
                new VirLineStage<{value: {nested: string}}>(
                    {
                        name: 'nothing',
                    },
                    ({state}) => {},
                ),
            ],
            {
                value: {nested: 'started'},
            },
            async ({virLine}) => {
                let updatedValue: {nested: string} | undefined;

                virLine.listenToState(
                    true,
                    {
                        value: true,
                    },
                    (newNested) => {
                        updatedValue = cloneDeep(newNested);
                    },
                );
                await virLine.triggerUpdate();

                assert.deepEquals(
                    updatedValue as AnyObject,
                    {nested: 'started'},
                    'state should not have updated yet',
                );

                virLine.currentState.value.nested = 'yo';

                assert.deepEquals(
                    updatedValue as AnyObject,
                    {nested: 'started'},
                    'state should not have updated yet',
                );

                await virLine.triggerUpdate();

                assert.deepEquals(
                    updatedValue as AnyObject,
                    {nested: 'yo'},
                    'state should not have updated yet',
                );
            },
        ),
    );

    it(
        "fails to remove a state listener that doesn't exist",
        withVirLine(
            [
                new VirLineStage<{hi: 'five'}>(
                    {
                        name: 'does nothing',
                    },
                    ({state}) => {},
                ),
            ],
            {
                hi: 'five',
            },
            ({virLine}) => {
                virLine.listenToState(false, {hi: false}, () => {});

                assert.isFalse(virLine.removeStateListener({hi: true}, () => {}));
                assert.isFalse(virLine.removeStateListener({hi: false}, () => {}));
            },
        ),
    );

    it(
        "can't start or pause twice",
        withVirLine([], {}, ({virLine}) => {
            assert.isTrue(virLine.startUpdateLoop());
            assert.isFalse(virLine.startUpdateLoop());

            assert.isTrue(virLine.pauseUpdateLoop());
            assert.isFalse(virLine.pauseUpdateLoop());
        }),
    );

    it(
        'rejects accessing stateType',
        withVirLine([], {}, ({virLine}) => {
            assert.throws(() => virLine.stateType, {
                matchMessage: "Access to 'stateType' is only allowed as a type.",
            });
        }),
    );

    it(
        'can attach two listeners to the same state selection',
        withVirLine(
            [
                new VirLineStage<{hi: string}>(
                    {
                        name: 'does nothing',
                    },
                    ({state}) => {
                        state.hi = 'four';
                    },
                ),
            ],
            {
                hi: 'five',
            },
            async ({virLine}) => {
                const values: string[] = [];

                const unListen1 = virLine.listenToState(true, {hi: true}, (value) => {
                    values.push(value);
                });
                const unListen2 = virLine.listenToState(true, {hi: true}, (value) => {
                    values.push(value);
                });

                assert.isTrue(unListen1());

                await virLine.triggerUpdate();

                unListen2();

                await virLine.triggerUpdate();

                assert.deepEquals(values, [
                    'five',
                    'five',
                    'four',
                ]);
            },
        ),
    );

    it(
        'can fire a state listener immediately',
        withVirLine(
            [
                new VirLineStage<{
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
                }>(
                    {
                        name: 'does nothing',
                    },
                    ({state}) => {},
                ),
            ],
            {
                a: {
                    f: {
                        h: 'h',
                    },
                    g: 123,
                },
                b: {
                    d: {
                        e: 'e',
                    },
                },
                c: {},
            },
            ({virLine}) => {
                let value: unknown;

                virLine.listenToState(true, {a: {g: true}}, (newValue) => {
                    value = newValue;
                });

                assert.strictEquals(value, 123);
            },
        ),
    );

    it(
        'supports enabled logging',
        withVirLine(
            [],
            {},
            ({virLine}) => {
                void virLine.triggerUpdate();
                virLine.destroy();
            },
            {
                enableLogging: true,
            },
        ),
    );

    it('skips updates if one is in progress', async () => {
        const deferredPromise = new DeferredPromise();

        const virLine = new VirLine(
            [
                new VirLineStage<{count: number}>(
                    {
                        name: 'delayed',
                    },
                    async ({state}) => {
                        state.count++;
                        await deferredPromise.promise;
                    },
                ),
            ],
            {
                count: 0,
            },
            {
                enableLogging: true,
            },
        );

        let skippedCount = 0;

        virLine.listen(VirLineUpdateSkippedEvent, () => {
            skippedCount++;
        });

        const firstUpdate = virLine.triggerUpdate();
        await virLine.triggerUpdate();
        await virLine.triggerUpdate();
        deferredPromise.resolve();
        await firstUpdate;
        await virLine.triggerUpdate();

        assert.strictEquals(virLine.currentState.count, 2);
        assert.strictEquals(skippedCount, 2);
    });

    it('emits a destroy event', () => {
        let destroyEmitted = false;

        const virLine = new VirLine([], {});

        virLine.listen(VirLineDestroyEvent, () => {
            destroyEmitted = true;
        });

        virLine.destroy();

        assert.isTrue(destroyEmitted);
    });

    it(
        'never collapses selected state object',
        withVirLine(
            [
                new VirLineStage<{
                    count: number;
                    entries: Record<string, Record<string, number>>;
                }>(
                    {
                        name: 'object mutator',
                    },
                    ({state}) => {
                        state.count++;
                        if (state.count % 2) {
                            state.entries = {
                                one: {
                                    child: 1,
                                    child2: 2,
                                },
                                two: {
                                    child: 1,
                                    child2: 2,
                                },
                            };
                        } else {
                            state.entries = {
                                one: {
                                    child: 1,
                                    child2: 2,
                                },
                            };
                        }
                    },
                ),
            ],
            {
                count: 0,
                entries: {},
            },
            async ({virLine}) => {
                const dataReceived: Record<string, Record<string, number>>[] = [];

                virLine.listenToState(true, {entries: true}, (data) => {
                    dataReceived.push(data);
                });

                await virLine.triggerUpdate();
                await virLine.triggerUpdate();
                await virLine.triggerUpdate();
                await virLine.triggerUpdate();

                assert.deepEquals(dataReceived, [
                    {},
                    {
                        one: {
                            child: 1,
                            child2: 2,
                        },
                        two: {
                            child: 1,
                            child2: 2,
                        },
                    },
                    {
                        one: {
                            child: 1,
                            child2: 2,
                        },
                    },
                    {
                        one: {
                            child: 1,
                            child2: 2,
                        },
                        two: {
                            child: 1,
                            child2: 2,
                        },
                    },
                    {
                        one: {
                            child: 1,
                            child2: 2,
                        },
                    },
                ]);
            },
        ),
    );

    it('fails on duplicate stage names', () => {
        assert.throws(
            () =>
                new VirLine(
                    [
                        new VirLineStage(
                            {
                                name: 'duplicate',
                            },
                            () => {},
                        ),
                        new VirLineStage(
                            {
                                name: 'duplicate',
                            },
                            () => {},
                        ),
                    ],
                    {},
                ),
            {
                matchMessage: 'Duplicate stage names provided to VirLine: duplicate',
            },
        );
    });
});
