import {
    ArrayElement,
    GenericSelectionSet,
    MaybePromise,
    UnionToIntersection,
} from '@augment-vir/common';
import {Duration, DurationUnit, FullDate} from 'date-vir';
import {Writable} from 'type-fest';
import {VirLineStage} from './stage';

/**
 * Type helper that extracts the require `State` from each given {@link VirLineStage} and then
 * combines them together into a single `State` type.
 *
 * @category Internals
 */
export type StagesToFullState<Stages extends ReadonlyArray<Readonly<VirLineStage<any>>>> = Writable<
    Readonly<UnionToIntersection<Parameters<ArrayElement<Stages>['executor']>[0]['state']>>
>;

/**
 * A generic state listener to avoid excessive type parameters requirements.
 *
 * @category Internals
 */
export type GenericListener = (selectedValue: any) => MaybePromise<void>;

/**
 * The object wherein state listeners are stored within a `VirLine` instance.
 *
 * @category Internals
 */
export type KeyedStateListeners = {
    selection: GenericSelectionSet;
    listeners: Set<GenericListener>;
    lastValue: any;
};

/**
 * Data emitted by a state update rate calculation event.
 *
 * @category VirLine
 */
export type VirLineStateUpdateRate = {
    calculatedAt: Readonly<FullDate>;
    updateCount: number;
    updatesPerSecond: number;
    durationSinceLastCalculation: Readonly<Duration<DurationUnit.Milliseconds>>;
};