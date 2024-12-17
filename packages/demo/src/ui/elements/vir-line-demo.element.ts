import {ensureError, extractErrorMessage} from '@augment-vir/common';
import {css, defineElementNoInputs, html, listen, perInstance} from 'element-vir';
import {RemoveListenerCallback, VirLinePauseEvent, VirLineUpdateRateEvent} from 'vir-line';
import {DemoShapeTypeEnum} from '../../demo-vir-line/demo-stages.js';
import {createDemoPipeline} from '../../demo-vir-line/demo-vir-line.js';
import {VirCanvas} from './vir-canvas.element.js';
import {VirControls} from './vir-controls.element.js';

export const VirLineDemo = defineElementNoInputs({
    tagName: 'vir-line-demo',
    styles: css`
        :host {
            font-family: sans-serif;
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            box-sizing: border-box;
            padding: 16px;
            overflow: hidden;
            gap: 32px;
            max-width: 100%;
            max-height: 100%;
        }

        ${VirCanvas} {
            border: 1px solid black;
            flex-grow: 1;
        }

        .error {
            color: red;
            font-weight: bold;
        }
    `,
    stateInitStatic: {
        pipeline: perInstance(createDemoPipeline),
        pipelineListenerRemovers: [] as RemoveListenerCallback[],
        isPaused: true,
        currentShapeType: DemoShapeTypeEnum.Circle,
        error: undefined as Error | undefined,
        framerate: 0,
    },
    init({state, updateState}) {
        updateState({
            pipelineListenerRemovers: [
                state.pipeline.listen(VirLinePauseEvent, (event) => {
                    updateState({isPaused: event.detail});
                }),
                state.pipeline.listen(VirLineUpdateRateEvent, (event) => {
                    updateState({framerate: event.detail.updatesPerSecond});
                }),
                state.pipeline.listenToState(true, {shape: {type: true}}, (shapeType) => {
                    console.info('state changed shape', shapeType);
                    updateState({currentShapeType: shapeType});
                }),
            ],
        });
    },
    cleanup({state}) {
        state.pipelineListenerRemovers.forEach((remover) => remover());
    },
    render({state, updateState}) {
        if (state.error) {
            return html`
                <p class="error">${extractErrorMessage(state.error)}</p>
            `;
        }

        return html`
            <${VirControls.assign({
                currentShapeType: state.currentShapeType,
                isPaused: state.isPaused,
            })}
                ${listen(VirControls.events.newShape, (event) => {
                    state.pipeline.currentState.shape.type = event.detail;
                })}
                ${listen(VirControls.events.stutter, () => {
                    state.pipeline.currentState.shouldStutter = true;
                })}
                ${listen(VirControls.events.playPipeline, (event) => {
                    if (event.detail) {
                        state.pipeline.startUpdateLoop();
                    } else {
                        state.pipeline.pauseUpdateLoop();
                    }
                })}
            ></${VirControls}>
            <p>FPS: ${Math.round(state.framerate)}</p>
            <${VirCanvas}
                ${listen(VirCanvas.events.canvasCreate, (event) => {
                    try {
                        const canvas = event.detail;
                        const renderContext = canvas.getContext('2d');
                        if (!renderContext) {
                            throw new Error('Failed to get 2d render context from canvas element.');
                        }
                        state.pipeline.currentState.canvas = canvas;
                        state.pipeline.currentState.renderContext = renderContext;
                        state.pipeline.startUpdateLoop();
                    } catch (caught) {
                        updateState({error: ensureError(caught)});
                    }
                })}
            ></${VirCanvas}>
        `;
    },
});
