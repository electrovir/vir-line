import {AnyObject, MaybePromise, isTruthy} from '@augment-vir/common';
import {Duration, DurationUnit} from 'date-vir';
import {EmptyObject} from 'type-fest';
import {VirLineOptions} from './options';

/**
 * Some simple checks to verify that a set of {@link VirLineStage} instances is a valid set.
 *
 * @category Internals
 */
export function assertValidStages(
    stages: ReadonlyArray<Readonly<VirLineStage<any>>>,
    options: Readonly<Pick<VirLineOptions, 'allowDuplicateStageNames'>>,
) {
    const duplicateStageNames: string[] = [];
    const stageNameSet = new Set<string>();
    stages.forEach((stage) => {
        const stageName = stage.stageId.name;

        if (stageNameSet.has(stageName)) {
            duplicateStageNames.push(stageName);
        } else {
            stageNameSet.add(stageName);
        }
    });

    if (duplicateStageNames.length && !options.allowDuplicateStageNames) {
        throw new Error(
            `Duplicate stage names provided to VirLine: ${duplicateStageNames.join(', ')}`,
        );
    }
}

/**
 * Input for a {@link VirLineStage}'s execution callback.
 *
 * @category Stage
 */
export type StageExecutorParams<State extends AnyObject> = Readonly<{
    /** The current state. Mutate it directly to modify the state. */
    state: State;
    /** The amount of time since the last state update. */
    timeSinceLastUpdate: Duration<DurationUnit.Milliseconds>;
    /**
     * The moment in time, in a millisecond unix timestamp, at which the current state update
     * started.
     */
    updateStartTime: Duration<DurationUnit.Milliseconds>;
}>;

/**
 * An object that identifies a {@link VirLineStage}.
 *
 * @category Internals
 */
export type StageId = {
    name: string;
    version?: string | number;
};

/**
 * Convert a {@link StageId} object into a string.
 *
 * @category Internals
 */
export function stageIdToString(stageId: Readonly<StageId>): string {
    return [
        stageId.name,
        stageId.version != undefined ? String(stageId.version) : undefined,
    ]
        .filter(isTruthy)
        .join('@');
}

/**
 * The function inside a {@link VirLineStage} which is executed during each state update. Return an
 * empty object (`{}`) or `undefined` if the stage has no outputs.
 *
 * @category Stage
 */
export type StageExecutor<State extends AnyObject> = (
    stageParams: StageExecutorParams<State>,
) => MaybePromise<void>;

/**
 * An individual execution step used within a `VirLine` instance.
 *
 * @category Stage
 */
export type VirLineStage<State extends AnyObject = EmptyObject> = {
    stageId: Readonly<StageId>;
    executor: StageExecutor<State>;
};
