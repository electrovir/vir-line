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

export type GenericListener = (selectedValue: any) => MaybePromise<void>;

export type KeyedStateListeners = {
    selection: GenericSelectionSet;
    listeners: Set<GenericListener>;
    lastValue: any;
};

export type VirLineStateUpdateRate = {
    calculatedAt: Readonly<FullDate>;
    updateCount: number;
    updatesPerSecond: number;
    durationSinceLastCalculation: Readonly<Duration<DurationUnit.Milliseconds>>;
};
