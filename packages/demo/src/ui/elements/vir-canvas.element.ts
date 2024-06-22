import {ensureError, extractErrorMessage} from '@augment-vir/common';
import {
    css,
    defineElementEvent,
    defineElementNoInputs,
    html,
    onDomCreated,
    onResize,
} from 'element-vir';
import {assertInstanceOf} from 'run-time-assertions';

export const VirCanvas = defineElementNoInputs({
    tagName: 'vir-canvas',
    events: {
        canvasCreate: defineElementEvent<HTMLCanvasElement>(),
    },
    styles: css`
        :host {
            display: flex;
            box-sizing: border-box;
            overflow: hidden;
        }

        .canvas-wrapper {
            display: flex;
            height: 100%;
            width: 100%;
            max-height: 100%;
            max-width: 100%;
            overflow: hidden;
        }

        .error {
            color: red;
            font-weight: bold;
        }
    `,
    stateInitStatic: {
        canvasError: undefined as undefined | Error,
    },
    renderCallback({state, updateState, dispatch, events}) {
        if (state.canvasError) {
            return html`
                <p class="error">${extractErrorMessage(state.canvasError)}</p>
            `;
        }

        return html`
            <div
                class="canvas-wrapper"
                ${onResize((size) => {
                    const canvas = size.target.querySelector('canvas');
                    assertInstanceOf(canvas, HTMLCanvasElement);
                    canvas.width = size.contentRect.width;
                    canvas.height = size.contentRect.height;
                })}
            >
                <canvas
                    ${onDomCreated((element) => {
                        try {
                            assertInstanceOf(element, HTMLCanvasElement);
                            dispatch(new events.canvasCreate(element));
                        } catch (caught) {
                            updateState({canvasError: ensureError(caught)});
                        }
                    })}
                ></canvas>
            </div>
        `;
    },
});
