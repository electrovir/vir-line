import {AnyObject} from '@augment-vir/common';
import {defineTypedCustomEvent, defineTypedEvent} from 'typed-event-target';
import {VirLineStage} from './stage';
import {StagesToFullState, VirLineStateUpdateRate} from './state';

/**
 * A union of all possible events that a `VirLine` instance can emit. This does not include state
 * update events, as the type of state update events vary depending on what part of the state was
 * listened to.
 */
export type VirLineEvents<Stages extends ReadonlyArray<Readonly<VirLineStage<any>>>> =
    | VirLineDestroyEvent
    | VirLineErrorEvent
    | VirLinePauseEvent
    | VirLineStateUpdateEvent<StagesToFullState<Stages>>
    | VirLineUpdateRateEvent
    | VirLineUpdateSkippedEvent;

/**
 * An event that is emitted from a `VirLine` instance when it is paused or resumed. The event.detail
 * value is a boolean which indicates whether it was paused (`true`) or resumed (`false`).
 *
 * @category Events
 */
export class VirLinePauseEvent extends defineTypedCustomEvent<boolean>()('vir-line-pause') {}

/**
 * An event that is emitted from a `VirLine` instance when its state-rate (or framerate) is
 * recalculated.
 *
 * @category Events
 */
export class VirLineUpdateRateEvent extends defineTypedCustomEvent<
    Readonly<VirLineStateUpdateRate>
>()('vir-line-state-rate-calculated') {}

/**
 * An event that is emitted from a `VirLine` instance when any part of its state changes. Note that
 * this will be very noisy as it will fire when any part of the state is changed.
 *
 * You probably should use the `VirLine.listenToState()` method with a specific sub-property
 * instead.
 *
 * @category Events
 */
export class VirLineStateUpdateEvent<
    State extends AnyObject,
> extends defineTypedCustomEvent<unknown>()('vir-line-state-change') {
    declare readonly detail: State;
}

/**
 * An event that is emitted from a `VirLine` instance when an error occurs while executing a state
 * update.
 *
 * @category Events
 */
export class VirLineErrorEvent extends defineTypedCustomEvent<Error>()('vir-line-error') {}

/**
 * An event that is emitted from a `VirLine` instance when an update is skipped (because an earlier
 * update is still in progress).
 *
 * @category Events
 */
export class VirLineUpdateSkippedEvent extends defineTypedEvent('vir-line-update-skipped') {}

/** An event that is emitted from a `VirLine` instance when it is destroyed. */
export class VirLineDestroyEvent extends defineTypedEvent('vir-line-destroy') {}
