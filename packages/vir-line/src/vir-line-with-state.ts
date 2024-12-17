import {AnyObject, SelectionSet} from '@augment-vir/common';
import {PartialDeep} from 'type-fest';
import {VirLineOptions} from './options.js';
import {VirLineStage} from './stage.js';
import {GenericListener} from './state.js';
import {VirLine} from './vir-line.js';

/**
 * A type used to specify a {@link VirLine} instance with a specific state.
 *
 * @category VirLine
 */
export interface VirLineWithState<State extends AnyObject = any> {
    /**
     * The stages which this {@link VirLine} instance will execute on each state update. These stages
     * will also determine the overall State type for this instance.
     */
    readonly stages: ReadonlyArray<Readonly<VirLineStage<any>>>;
    /**
     * All current {@link VirLineOptions} saved to this {@link VirLine} instance. This is externally
     * readonly. To update it, use {@link VirLine['updateOptions']}. This can also be set on
     * construction via the `initOptions` construction argument.
     *
     * @default defaultVirLineOptions
     */
    readonly options: VirLineOptions;
    /**
     * If `true`, the update loop is paused. If `false`, the update loop is automatically executing.
     *
     * @default true // unless `options.init.startUpdateLoopImmediately` is set to `true`
     */
    readonly isUpdateLoopPaused: boolean;
    /**
     * The current state. This initializes to a copy of the `initialState` constructor argument and
     * will be mutated by each state update.
     *
     * To listen to changes on the state, use {@link VirLine['listenToState']}.
     *
     * @default initialState
     */
    readonly currentState: NoInfer<State>;
    /**
     * A type-only accessor. This would be the same thing as `typeof currentState` but is a little
     * more obvious.
     *
     * @default typeof this.currentState
     */
    readonly stateType: NoInfer<State>;
    /**
     * Modifies the current options. All provided options are deeply merged with the existing
     * options, so you only need to provide the options which you wish to modify.
     */
    updateOptions(newOptions: Readonly<Omit<PartialDeep<VirLineOptions>, 'init'>>): void;
    /**
     * Start the automatic update loop. The interval between each update is controlled by
     * `options.updateLoopInterval`.
     *
     * @returns A boolean indicating whether the loop was started or not. (For example, if the loop
     *   was already started, calling this function again will return `false`.)
     */
    startUpdateLoop(): boolean;
    /**
     * Pause the automatic update loop.
     *
     * @returns A boolean indicating whether the loop was paused or not. (For example, if the loop
     *   was already paused, calling this function again will return `false`.)
     */
    pauseUpdateLoop(): boolean;
    /**
     * Clean up all state and call the `onDestroy` callback (set in the options constructor
     * parameter).
     */
    destroy(): void;
    /**
     * Listen to state updates on a specific sub property.
     *
     * @returns A callback that, upon being called, will remove the listener.
     */
    listenToState: VirLine<[VirLineStage<State>]>['listenToState'];
    /** Remove all current state listeners. */
    removeAllStateListeners(): void;
    /**
     * Remove the given listener from the given state key array.
     *
     * @returns A boolean indicating whether the listener was removed or not.
     */
    removeStateListener(
        selection: SelectionSet<NoInfer<State>>,
        listener: GenericListener,
    ): boolean;
    /** Triggers a new update at any time, as long as an update is not already in progress. */
    triggerUpdate(): Promise<void>;
}
