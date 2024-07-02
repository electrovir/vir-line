import {
    createDeferredPromiseWrapper,
    MaybePromise,
    wait,
    waitUntilTruthy,
} from '@augment-vir/common';
import {assert} from '@open-wc/testing';
import {assertThrows} from 'run-time-assertions';
import {PartialDeep} from 'type-fest';
import {
    VirLineDestroyEvent,
    VirLineErrorEvent,
    VirLineUpdateRateEvent,
    VirLineUpdateSkippedEvent,
} from './events';
import {VirLineOptions} from './options';
import {VirLineStage} from './stage';
import {StagesToFullState} from './state';
import {VirLine} from './vir-line';

describe(VirLine.name, () => {
    function withVirLine<const Stages extends ReadonlyArray<Readonly<VirLineStage<any>>>>(
        args: [
            Readonly<Stages>,
            NoInfer<StagesToFullState<Stages>>,
            Readonly<PartialDeep<NoInfer<VirLineOptions>>>?,
        ],
        callback: (args: {virLine: VirLine<Stages>}) => MaybePromise<void>,
    ) {
        return async () => {
            const virLine = new VirLine(...args);

            await callback({virLine});

            virLine.destroy();
        };
    }

    it(
        'runs automatically and stops when destroyed',
        withVirLine(
            [
                [
                    {
                        executor({state}: {state: {count: number}}) {
                            state.count++;
                        },

                        stageId: {
                            name: 'incrementor',
                        },
                    },
                ],
                {
                    count: 0,
                },
                {
                    updateLoopInterval: {milliseconds: 1},
                    init: {
                        startUpdateLoopImmediately: true,
                    },
                },
            ],
            async ({virLine}) => {
                await waitUntilTruthy(() => virLine.currentState.count > 5);

                virLine.destroy();
                const countAtDestruction = virLine.currentState.count;

                await wait(2000);

                assert.strictEqual(countAtDestruction, virLine.currentState.count);
            },
        ),
    );

    it(
        'runs with default update interval',
        withVirLine(
            [
                [
                    {
                        executor({state}: {state: {count: number}}) {
                            state.count++;
                        },

                        stageId: {
                            name: 'incrementor',
                        },
                    },
                ],
                {
                    count: 0,
                },
            ],
            async ({virLine}) => {
                virLine.startUpdateLoop();

                await waitUntilTruthy(() => virLine.currentState.count > 5);

                virLine.destroy();
            },
        ),
    );

    it(
        'calculates update rate',
        withVirLine(
            [
                [],
                {},
                {
                    updateLoopInterval: {milliseconds: 1},
                    minUpdateRateCalculationInterval: {milliseconds: 1},
                },
            ],
            async ({virLine}) => {
                let updatesPerSecond = 0;

                virLine.listen(VirLineUpdateRateEvent, (event) => {
                    updatesPerSecond = event.detail.updatesPerSecond;
                });
                virLine.startUpdateLoop();

                await waitUntilTruthy(() => updatesPerSecond > 0);
            },
        ),
    );

    it(
        'does not calculate update rate if disabled',
        withVirLine(
            [
                [],
                {},
                {
                    updateLoopInterval: {milliseconds: 1},
                    minUpdateRateCalculationInterval: undefined,
                },
            ],
            async ({virLine}) => {
                let updatesPerSecond = 0;

                virLine.listen(VirLineUpdateRateEvent, (event) => {
                    updatesPerSecond = event.detail.updatesPerSecond;
                });
                virLine.startUpdateLoop();

                await wait(2000);

                virLine.destroy();
                assert.strictEqual(updatesPerSecond, 0);
            },
        ),
    );

    it(
        'emits an error event if a stage errors',
        withVirLine(
            [
                [
                    {
                        executor() {
                            throw new Error('FAIL');
                        },
                        stageId: {
                            name: 'intentional failure',
                        },
                    },
                ],
                {},
            ],
            async ({virLine}) => {
                let error: Error | undefined;

                virLine.listen(VirLineErrorEvent, (event) => {
                    error = event.detail;
                });
                await virLine.triggerUpdate();

                await waitUntilTruthy(() => error);

                assert.strictEqual(error?.message, "Stage 'intentional failure' failed: FAIL");
            },
        ),
    );

    it(
        'supports state listeners',
        withVirLine(
            [
                [
                    {
                        executor({state}: {state: {value: {nested: string}; count: number}}) {
                            state.count++;
                            if (state.count > 10) {
                                state.value.nested = 'finished';
                            } else if (state.count > 20) {
                                state.value.nested = 'over finished';
                            }
                        },
                        stageId: {
                            name: 'count then update',
                        },
                    },
                ],
                {
                    value: {nested: 'started'},
                    count: 0,
                },
            ],
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

                await waitUntilTruthy(async () => {
                    await virLine.triggerUpdate();
                    return updatedValue;
                });
                assert.strictEqual(updatedValue, 'finished');

                assert.isTrue(unListen());
                assert.isFalse(unListen());

                await waitUntilTruthy(async () => {
                    await virLine.triggerUpdate();

                    return virLine.currentState.count > 25;
                });

                assert.strictEqual(updatedValue, 'finished');
            },
        ),
    );

    it(
        "fails to remove a state listener that doesn't exist",
        withVirLine(
            [
                [
                    {
                        executor({state}: {state: {hi: 'five'}}) {},
                        stageId: {name: 'does nothing'},
                    },
                ],
                {
                    hi: 'five',
                },
            ],
            async ({virLine}) => {
                virLine.listenToState(false, {hi: false}, () => {});

                assert.isFalse(virLine.removeStateListener({hi: true}, () => {}));
                assert.isFalse(virLine.removeStateListener({hi: false}, () => {}));
            },
        ),
    );

    it(
        "can't start or pause twice",
        withVirLine(
            [
                [],
                {},
            ],
            async ({virLine}) => {
                assert.isTrue(virLine.startUpdateLoop());
                assert.isFalse(virLine.startUpdateLoop());

                assert.isTrue(virLine.pauseUpdateLoop());
                assert.isFalse(virLine.pauseUpdateLoop());
            },
        ),
    );

    it(
        'rejects accessing stateType',
        withVirLine(
            [
                [],
                {},
            ],
            async ({virLine}) => {
                assertThrows(() => virLine.stateType, {
                    matchMessage: "Access to 'stateType' is only allowed as a type.",
                });
            },
        ),
    );

    it(
        'can attach two listeners to the same state selection',
        withVirLine(
            [
                [
                    {
                        executor({state}: {state: {hi: string}}) {
                            state.hi = 'four';
                        },
                        stageId: {name: 'does nothing'},
                    },
                ],
                {
                    hi: 'five',
                },
            ],
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

                assert.deepStrictEqual(values, [
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
                [
                    {
                        executor({
                            state,
                        }: {
                            state: {
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
                                c: {};
                            };
                        }) {},
                        stageId: {name: 'does nothing'},
                    },
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
            ],
            async ({virLine}) => {
                let value: unknown;

                virLine.listenToState(true, {a: {g: true}}, (newValue) => {
                    value = newValue;
                });

                assert.strictEqual(value, 123);
            },
        ),
    );

    it(
        'supports enabled logging',
        withVirLine(
            [
                [],
                {},
                {
                    enableLogging: true,
                },
            ],
            async ({virLine}) => {
                virLine.triggerUpdate();
                virLine.destroy();
            },
        ),
    );

    it('skips updates if one is in progress', async () => {
        const deferredPromise = createDeferredPromiseWrapper<void>();

        const virLine = new VirLine(
            [
                {
                    async executor({state}: {state: {count: number}}) {
                        state.count++;
                        await deferredPromise.promise;
                    },
                    stageId: {
                        name: 'delayed',
                    },
                },
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

        assert.strictEqual(virLine.currentState.count, 2);
        assert.strictEqual(skippedCount, 2);
    });

    it('emits a destroy event', async () => {
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
                [
                    {
                        stageId: {
                            name: 'object mutator',
                        },
                        executor({
                            state,
                        }: {
                            state: {count: number; entries: Record<string, Record<string, number>>};
                        }) {
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
                    },
                ],
                {count: 0, entries: {}},
            ],
            async ({virLine}) => {
                const dataReceived: Record<string, Record<string, number>>[] = [];

                virLine.listenToState(true, {entries: true}, (data) => {
                    dataReceived.push(data);
                });

                await virLine.triggerUpdate();
                await virLine.triggerUpdate();
                await virLine.triggerUpdate();
                await virLine.triggerUpdate();

                assert.deepStrictEqual(dataReceived, [
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

    it('fails on duplicate stage names', async () => {
        assertThrows(
            () =>
                new VirLine(
                    [
                        {
                            executor() {},
                            stageId: {
                                name: 'duplicate',
                            },
                        },
                        {
                            executor() {},
                            stageId: {
                                name: 'duplicate',
                            },
                        },
                    ],
                    {},
                ),
            {matchMessage: 'Duplicate stage names provided to VirLine: duplicate'},
        );
    });

    it('can allow duplicate stage names', async () => {
        new VirLine(
            [
                {
                    executor() {},
                    stageId: {
                        name: 'duplicate',
                    },
                },
                {
                    executor() {},
                    stageId: {
                        name: 'duplicate',
                    },
                },
            ],
            {},
            {
                allowDuplicateStageNames: true,
            },
        );
    });
});
