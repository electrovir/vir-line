import {
    AnyObject,
    MaybePromise,
    PickCollapsedSelection,
    SelectionSet,
    awaitedForEach,
    callAsynchronously,
    ensureErrorAndPrependMessage,
    makeWritable,
    mergeDeep,
    selectCollapsedFrom,
    wrapString,
} from '@augment-vir/common';
import {Duration, DurationUnit, convertDuration, createFullDate, userTimezone} from 'date-vir';
import {isJsonEqual} from 'run-time-assertions';
import {PartialDeep} from 'type-fest';
import {ListenTarget, RemoveListenerCallback} from 'typed-event-target';
import {isDeepEqual} from './deep-equal';
import {
    VirLineDestroyEvent,
    VirLineErrorEvent,
    VirLineEvents,
    VirLinePauseEvent,
    VirLineStateUpdateEvent,
    VirLineUpdateRateEvent,
    VirLineUpdateSkippedEvent,
} from './events';
import {VirLineOptions, defaultVirLineOptions, useAnimationFrames} from './options';
import {StageExecutorParams, VirLineStage, assertValidStages, stageIdToString} from './stage';
import {GenericListener, KeyedStateListeners, StagesToFullState} from './state';

export type VirLineWithState<State extends AnyObject> = VirLine<[VirLineStage<State>]>;

export class VirLine<
    const Stages extends ReadonlyArray<Readonly<VirLineStage<any>>>,
> extends ListenTarget<VirLineEvents<Stages>> {
    /**
     * All current {@link VirLineOptions} saved to this {@link VirLine} instance. This is externally
     * readonly. To update it, use {@link updateOptions}. This can also be set on construction via
     * the `initOptions` construction argument.
     *
     * @default defaultVirLineOptions
     */
    public readonly options: VirLineOptions<StagesToFullState<Stages>> = defaultVirLineOptions;
    /**
     * If `true`, the update loop is paused. If `false`, the update loop is automatically executing.
     *
     * @default true // unless `options.init.startUpdateLoopImmediately` is set to `true`
     */
    public readonly isUpdateLoopPaused: boolean = true;
    /**
     * The current state. This initializes to a copy of the `initialState` constructor argument and
     * will be mutated by each state update.
     *
     * To listen to changes on the state, use {@link listenToState}.
     *
     * @default initialState
     */
    public readonly currentState: StagesToFullState<Stages>;

    /**
     * A type-only accessor. This would be the same thing as `typeof currentState` but is a little
     * more obvious.
     *
     * @default typeof this.currentState
     */
    public get stateType(): StagesToFullState<Stages> {
        throw new Error("Access to 'stateType' is only allowed as a type.");
    }

    /** `performance.now()` value from the most recent state update execution. */
    private lastStateUpdateHighResTimestamp = 0;

    /** Running totals used to calculate state update rate. */
    private updateRateCounters = {
        /** The `performance.now()` value from the last time that the update rate was calculated. */
        calculatedAtHighResTimestamp: performance.now(),
        /**
         * The update count for the next update rate calculation. This is incremented every time a
         * state update occurs and reset to `0` when a update rate calculation occurs.
         */
        updateCount: 0,
    };

    /**
     * Indicates whether a state update is currently executing. While this is `true`, all state
     * updates will be blocked to prevent concurrent state updates.
     *
     * @default false
     */
    private isCurrentlyUpdating = false;

    /**
     * All current fine-grained state listeners. Add state listeners to this list with
     * {@link listenToState} and remove listeners with {@link removeStateListener}.
     */
    private stateListeners: KeyedStateListeners[] = [];

    constructor(
        /**
         * The stages which this {@link VirLine} instance will execute on each state update. These
         * stages will also determine the overall State type for this instance.
         */
        public stages: Readonly<Stages>,
        /**
         * The initial state for this {@link VirLine} instance.
         *
         * **WARNING**: this _will_ get mutated.
         */
        initialState: NoInfer<StagesToFullState<Stages>>,
        /**
         * All options for this {@link VirLine} instance. This can also be updated after construction
         * via {@link updateOptions}.
         *
         * @default defaultVirLineOptions
         */
        initOptions?: Readonly<PartialDeep<NoInfer<VirLineOptions<StagesToFullState<Stages>>>>>,
    ) {
        super();

        this.currentState = {...initialState};
        if (initOptions) {
            this.updateOptions(initOptions);
        }

        assertValidStages(stages, this.options);

        if (this.options.init.startUpdateLoopImmediately) {
            this.startUpdateLoop();
        }
    }

    /**
     * Modifies the current options. All provided options are deeply merged with the existing
     * options, so you only need to provide the options which you wish to modify.
     */
    public updateOptions(
        newOptions: Readonly<Omit<PartialDeep<VirLineOptions<typeof this.stateType>>, 'init'>>,
    ): void {
        makeWritable(this).options = mergeDeep<typeof this.options>(this.options, newOptions);
    }

    /**
     * Start the automatic update loop. The interval between each update is controlled by
     * `options.updateLoopInterval`.
     *
     * @returns A boolean indicating whether the loop was started or not. (For example, if the loop
     *   was already started, calling this function again will return `false`.)
     */
    public startUpdateLoop(): boolean {
        if (this.isUpdateLoopPaused) {
            makeWritable(this).isUpdateLoopPaused = false;
            this.dispatch(new VirLinePauseEvent({detail: false}));
            this.updateRateCounters = {
                calculatedAtHighResTimestamp: performance.now(),
                updateCount: 0,
            };
            this.runUpdateLoop();
            return true;
        } else {
            /** If the update loop is already started, there's nothing to do here. */
            return false;
        }
    }

    /**
     * Pause the automatic update loop.
     *
     * @returns A boolean indicating whether the loop was paused or not. (For example, if the loop
     *   was already paused, calling this function again will return `false`.)
     */
    public pauseUpdateLoop(): boolean {
        if (this.isUpdateLoopPaused) {
            /** If the update loop is already paused, there's nothing to do here. */
            return false;
        } else {
            makeWritable(this).isUpdateLoopPaused = true;
            this.dispatch(new VirLinePauseEvent({detail: true}));
            return true;
        }
    }

    /** Clean up all state and call the `onDestroy` callback (set in {@link options}). */
    public override destroy() {
        this.pauseUpdateLoop();
        this.removeAllStateListeners();

        this.dispatch(new VirLineDestroyEvent());

        super.destroy();
    }
    /**
     * Listen to state updates on a specific sub property.
     *
     * @returns A callback that, upon being called, will remove the listener.
     */
    public listenToState<const Selection extends SelectionSet<typeof this.stateType>>(
        fireImmediately: boolean,
        selection: Selection,
        listener: (
            selection: PickCollapsedSelection<typeof this.stateType, Selection>,
        ) => MaybePromise<void>,
    ): RemoveListenerCallback {
        const existingKeyedStateListeners = this.stateListeners.find((stateListeners) =>
            isJsonEqual(stateListeners.selection as any, selection as any),
        );

        const currentValue = selectCollapsedFrom<typeof this.stateType, Selection>(
            this.currentState,
            selection,
        );

        if (existingKeyedStateListeners) {
            existingKeyedStateListeners.listeners.add(listener);
        } else {
            this.stateListeners.push({
                selection,
                lastValue: currentValue,
                listeners: new Set([listener]),
            });
        }

        if (fireImmediately) {
            listener(currentValue);
        }

        return () => {
            return this.removeStateListener(selection, listener);
        };
    }

    /** Remove all current state listeners. */
    public removeAllStateListeners() {
        this.stateListeners = [];
    }

    /**
     * Remove the given listener from the given state key array.
     *
     * @returns A boolean indicating whether the listener was removed or not.
     */
    public removeStateListener(
        selection: SelectionSet<typeof this.stateType>,
        listener: GenericListener,
    ): boolean {
        const existingKeyedStateListenersIndex = this.stateListeners.findIndex((stateListeners) =>
            isJsonEqual(stateListeners.selection as any, selection as any),
        );

        const existingKeyedStateListeners = this.stateListeners[existingKeyedStateListenersIndex];

        if (!existingKeyedStateListeners) {
            return false;
        }

        if (!existingKeyedStateListeners.listeners.delete(listener)) {
            return false;
        }

        if (!existingKeyedStateListeners.listeners.size) {
            /** Remove the listeners object if it has no more listeners. */
            this.stateListeners.splice(existingKeyedStateListenersIndex, 1);
        }

        return true;
    }

    public async triggerUpdate(): Promise<void> {
        if (this.isCurrentlyUpdating) {
            this.dispatch(new VirLineUpdateSkippedEvent());
            if (this.options.enableLogging) {
                console.warn('Update skipped: another is still in progress.');
            }
            /** Skip the current update if a previous update is still executing. */
            return undefined;
        }

        this.isCurrentlyUpdating = true;
        const highResTimestamp = performance.now();

        const timeSinceLastUpdate: Duration<DurationUnit.Milliseconds> = {
            milliseconds: highResTimestamp - this.lastStateUpdateHighResTimestamp,
        };
        this.lastStateUpdateHighResTimestamp = highResTimestamp;
        this.updateRateCounters.updateCount++;

        if (this.options.enableLogging) {
            console.info(`updating state at: ${highResTimestamp}`);
        }
        const error = await this.runStateUpdate(highResTimestamp, timeSinceLastUpdate);
        if (this.options.enableLogging) {
            console.info(`state update took: ${performance.now() - highResTimestamp}`);
        }

        this.isCurrentlyUpdating = false;

        /** This is just to handle edge cases. */
        /* c8 ignore next 3 */
        if (error) {
            throw error;
        }

        this.fireStateListeners();
    }

    protected runUpdateLoop() {
        callAsynchronously(() => this.triggerUpdate());

        const executeAgain = () => {
            if (!this.isUpdateLoopPaused) {
                this.runUpdateLoop();
            }
        };

        if (this.options.updateLoopInterval === useAnimationFrames) {
            window.requestAnimationFrame(executeAgain);
        } else {
            const timeoutDuration = convertDuration(
                this.options.updateLoopInterval,
                DurationUnit.Milliseconds,
            );

            setTimeout(executeAgain, timeoutDuration.milliseconds);
        }
    }

    protected async fireStateListeners() {
        this.dispatch(
            new VirLineStateUpdateEvent<typeof this.stateType>({detail: this.currentState}),
        );
        const listenerPromises: Promise<void>[] = [];

        this.stateListeners.forEach((stateListener) => {
            const newValue = selectCollapsedFrom<typeof this.stateType, any>(
                this.currentState,
                stateListener.selection,
            );
            if (!isDeepEqual(newValue, stateListener.lastValue)) {
                stateListener.lastValue = newValue;
                stateListener.listeners.forEach((listener) => {
                    listenerPromises.push(callAsynchronously(async () => await listener(newValue)));
                });
            }
        });

        await Promise.all(listenerPromises);
    }

    protected async runStateUpdate(
        highResTimestamp: number,
        timeSinceLastUpdate: Duration<DurationUnit.Milliseconds>,
    ): Promise<Error | undefined> {
        try {
            const universalStageParams: Omit<
                StageExecutorParams<typeof this.stateType>,
                'state'
            > = {
                timeSinceLastUpdate,
                updateStartTime: {milliseconds: highResTimestamp},
            };
            await awaitedForEach(this.stages, async (stage) => {
                const stageParams: StageExecutorParams<typeof this.stateType> = {
                    ...universalStageParams,
                    state: this.currentState,
                };
                try {
                    await stage.executor(stageParams);
                } catch (caught) {
                    const error = ensureErrorAndPrependMessage(
                        caught,
                        `Stage ${wrapString({value: stageIdToString(stage.stageId), wrapper: "'"})} failed`,
                    );
                    console.error(error);
                    this.dispatch(
                        new VirLineErrorEvent({
                            detail: error,
                        }),
                    );
                }
            });

            this.calculateUpdateRate(highResTimestamp);

            return;
            /** This is just to handle edge cases. */
            /* c8 ignore next 12 */
        } catch (caught) {
            const error = ensureErrorAndPrependMessage(caught, 'Failed to update state');
            console.error(error);

            this.dispatch(
                new VirLineErrorEvent({
                    detail: error,
                }),
            );

            return error;
        }
    }

    protected calculateUpdateRate(highResTimestamp: number): void {
        if (this.options.minUpdateRateCalculationInterval == undefined) {
            /** If the user has disabled update rate calculations, don't do anything here. */
            return;
        }

        const interval: number = convertDuration(
            this.options.minUpdateRateCalculationInterval,
            DurationUnit.Milliseconds,
        ).milliseconds;
        const millisecondsSinceLastUpdate =
            highResTimestamp - this.updateRateCounters.calculatedAtHighResTimestamp;

        if (millisecondsSinceLastUpdate > interval) {
            const updateCount = this.updateRateCounters.updateCount;

            this.updateRateCounters = {
                calculatedAtHighResTimestamp: highResTimestamp,
                updateCount: 0,
            };

            this.dispatch(
                new VirLineUpdateRateEvent({
                    detail: {
                        calculatedAt: createFullDate(
                            highResTimestamp + performance.timeOrigin,
                            userTimezone,
                        ),
                        durationSinceLastCalculation: {milliseconds: millisecondsSinceLastUpdate},
                        updateCount,
                        updatesPerSecond: (updateCount / millisecondsSinceLastUpdate) * 1000,
                    },
                }),
            );
        }
    }
}
