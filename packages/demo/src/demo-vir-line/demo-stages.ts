import {addPercent, wait, wrapNumber} from '@augment-vir/common';
import {VirLineStage} from 'vir-line';

export enum DemoShapeTypeEnum {
    Circle = 'circle',
    Square = 'square',
    Triangle = 'triangle',
}

function calculateTrianglePoints(center: {x: number; y: number}, size: number) {
    const radius = size / 2;
    const angles = [
        (Math.PI * (90 + 120)) / 180,
        (Math.PI * (90 + 240)) / 180,
    ] as const;

    return [
        [
            center.x,
            center.y - radius,
        ],
        [
            center.x + radius * Math.cos(angles[0]),
            center.y - radius * Math.sin(angles[0]),
        ],
        [
            center.x + radius * Math.cos(angles[1]),
            center.y - radius * Math.sin(angles[1]),
        ],
    ] as const;
}

export const renderShapeStage: VirLineStage<{
    canvasSize: {
        width: number;
        height: number;
    };
    shape: {
        color: {
            h: number;
            s: number;
            l: number;
        };
        type: DemoShapeTypeEnum;
    };
    renderContext:
        | Pick<
              CanvasRenderingContext2D,
              'fillStyle' | 'fillRect' | 'beginPath' | 'arc' | 'fill' | 'moveTo' | 'lineTo'
          >
        | undefined;
}> = {
    stageId: {
        name: 'render shape',
        version: 1,
    },
    executor({state}) {
        if (!state.renderContext) {
            /** Nothing to do if there's no render context yet */
            return;
        }

        const size = Math.min(state.canvasSize.width, state.canvasSize.height) / 2;

        const colorString = `hsl(${[
            state.shape.color.h,
            addPercent(state.shape.color.s),
            addPercent(state.shape.color.l),
        ].join(' ')})`;

        state.renderContext.fillStyle = 'white';
        state.renderContext.fillRect(0, 0, state.canvasSize.width, state.canvasSize.height);
        const canvasCenter = {
            x: state.canvasSize.width / 2,
            y: state.canvasSize.height / 2,
        };

        state.renderContext.fillStyle = colorString;
        if (state.shape.type === DemoShapeTypeEnum.Square) {
            const squareSize = size / Math.sqrt(2);
            const squareStart = {
                x: canvasCenter.x - squareSize / 2,
                y: canvasCenter.y - squareSize / 2,
            };
            state.renderContext.fillRect(squareStart.x, squareStart.y, squareSize, squareSize);
        } else if (state.shape.type === DemoShapeTypeEnum.Circle) {
            state.renderContext.beginPath();
            state.renderContext.arc(canvasCenter.x, canvasCenter.y, size / 2, 0, Math.PI * 2);
            state.renderContext.fill();
        } else if (state.shape.type === DemoShapeTypeEnum.Triangle) {
            state.renderContext.beginPath();
            const trianglePoints = calculateTrianglePoints(canvasCenter, size);
            state.renderContext.moveTo(trianglePoints[0][0], trianglePoints[0][1]);
            state.renderContext.lineTo(trianglePoints[1][0], trianglePoints[1][1]);
            state.renderContext.lineTo(trianglePoints[2][0], trianglePoints[2][1]);
            state.renderContext.fill();
        }
    },
};

/** Intentionally cause a rendering stutter. */
export const renderStutterStage: VirLineStage<{
    shouldStutter: boolean;
}> = {
    stageId: {
        name: 'render stutter',
        version: 1,
    },
    async executor({state}) {
        if (!state.shouldStutter) {
            return;
        }

        await wait(1000);

        state.shouldStutter = false;
    },
};

export const canvasSizeStage: VirLineStage<{
    canvasSize: {height: number; width: number};
    canvas: Pick<HTMLCanvasElement, 'height' | 'width'> | undefined;
}> = {
    stageId: {
        name: 'canvas size',
        version: 1,
    },
    executor({state}) {
        if (!state.canvas) {
            return;
        }

        state.canvasSize = {
            width: state.canvas.width,
            height: state.canvas.height,
        };
    },
};

export const debugStage: VirLineStage = {
    stageId: {
        name: 'debug',
        version: 1,
    },
    executor() {
        console.info('render');
    },
};

export const rainbowStage: VirLineStage<{
    shape: {
        color: {
            h: number;
            s: number;
            l: number;
        };
        huePerMillisecond: number;
    };
}> = {
    stageId: {
        name: 'rainbow',
        version: 1,
    },
    executor({state, timeSinceLastUpdate}) {
        const newHue = wrapNumber({
            value:
                state.shape.color.h +
                timeSinceLastUpdate.milliseconds * state.shape.huePerMillisecond,
            max: 360,
            min: 0,
        });

        state.shape.color.h = newHue;
    },
};
