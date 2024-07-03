import {AnyObject, SelectionSet} from '@augment-vir/common';
import {PartialDeep} from 'type-fest';
import {VirLineOptions} from './options';
import {VirLineStage} from './stage';
import {GenericListener} from './state';
import {VirLine} from './vir-line';

export interface VirLineWithState<State extends AnyObject = any> {
    readonly stages: ReadonlyArray<Readonly<VirLineStage<any>>>;
    readonly options: VirLineOptions;
    readonly isUpdateLoopPaused: boolean;
    readonly currentState: NoInfer<State>;
    readonly stateType: NoInfer<State>;
    updateOptions(newOptions: Readonly<Omit<PartialDeep<VirLineOptions>, 'init'>>): void;
    startUpdateLoop(): boolean;
    pauseUpdateLoop(): boolean;
    destroy(): void;
    listenToState: VirLine<[VirLineStage<State>]>['listenToState'];
    removeAllStateListeners(): void;
    removeStateListener(
        selection: SelectionSet<NoInfer<State>>,
        listener: GenericListener,
    ): boolean;
    triggerUpdate(): Promise<void>;
}
