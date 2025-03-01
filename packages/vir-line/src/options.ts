import {AnyDuration} from 'date-vir';

/**
 * The string used in {@link VirLineOptions['updateLoopInterval']} to indicate that the update loop
 * should be tied to animation frames.
 *
 * @category Internal
 */
export const useAnimationFrames = 'animation frames';

/**
 * Options supported by the `VirLine` class.
 *
 * @category VirLine
 */
export type VirLineOptions = {
    /** These options can only be set on initial `VirLine` construction. */
    init: {
        /**
         * Start the `VirLine` instance's automatic update loop immediately.
         *
         * @default false
         */
        startUpdateLoopImmediately: boolean;
    };

    /**
     * The automatic state update loop interval.
     *
     * - Set to `'animation frames'` or the variable `useAnimationFrames` to use the browser's
     *   framerate to trigger state updates. (recommended)
     * - Set to a duration to wait that long between state updates.
     *
     * Note that this interval will not have any effect if the `VirLine` instance is paused.
     *
     * @default 'animation frames' // AKA the variable `useAnimationFrames`
     */
    updateLoopInterval: typeof useAnimationFrames | AnyDuration;

    /**
     * The minimum interval between state update rate calculations.
     *
     * Note that the update rate is only calculated on an actual state update, so the duration
     * between update rate calculations will often be longer that this.
     *
     * Shorter times will cause `VirLineUpdateRateEvent` to be emitted more frequently, but will
     * result in less stable values.
     *
     * Longer times will result in more stable values but will result in a less meaningful rate
     * since it'll be averaged over longer periods of time.
     *
     * Set this to `undefined` to disable update rate interval calculation entirely.
     *
     * @default {milliseconds: 500}
     */
    minUpdateRateCalculationInterval: AnyDuration | undefined;

    /**
     * Set this to `true` to turn logs on. This may produce a lot of logs if the state update
     * interval is short enough (such as the recommended option of matching animation frames).
     *
     * @default false
     */
    enableLogging: boolean;

    /**
     * Dropping below this state update rate will trigger warnings if `enableLogging` is enabled.
     * Set to `undefined` to disable warnings.
     *
     * @default undefined
     */
    targetUpdateRate: number | undefined;
};

/**
 * The default value for {@link VirLineOptions}.
 *
 * @category Internal
 */
export const defaultVirLineOptions: VirLineOptions = {
    enableLogging: false,
    targetUpdateRate: undefined,
    init: {
        startUpdateLoopImmediately: false,
    },
    minUpdateRateCalculationInterval: {milliseconds: 500},
    updateLoopInterval: useAnimationFrames,
};
