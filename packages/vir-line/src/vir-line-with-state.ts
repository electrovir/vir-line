import {AnyObject, MaybePromise, PickCollapsedSelection, SelectionSet} from '@augment-vir/common';
import {IsAny, PartialDeep} from 'type-fest';
import {RemoveListenerCallback} from 'typed-event-target';
import {VirLineOptions} from './options';
import {VirLineStage} from './stage';
import {GenericListener} from './state';

export interface VirLineWithState<State extends AnyObject = any> {
    readonly stages: ReadonlyArray<Readonly<VirLineStage<any>>>;
    readonly options: VirLineOptions;
    readonly isUpdateLoopPaused: boolean;
    readonly currentState: State;
    readonly stateType: State;
    updateOptions(newOptions: Readonly<Omit<PartialDeep<VirLineOptions>, 'init'>>): void;
    startUpdateLoop(): boolean;
    pauseUpdateLoop(): boolean;
    destroy(): void;
    listenToState<const Selection extends SelectionSet<State>>(
        fireImmediately: boolean,
        selection: Selection,
        listener: (
            selection: IsAny<State> extends true ? PickCollapsedSelection<State, Selection> : any,
        ) => MaybePromise<void>,
    ): RemoveListenerCallback;
    removeAllStateListeners(): void;
    removeStateListener(selection: SelectionSet<State>, listener: GenericListener): boolean;
    triggerUpdate(): Promise<void>;
}
