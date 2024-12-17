import { addPercent, wait, wrapNumber } from '@augment-vir/common';
import { VirLineStage } from 'vir-line';
export var DemoShapeTypeEnum;
(function (DemoShapeTypeEnum) {
    DemoShapeTypeEnum["Circle"] = "circle";
    DemoShapeTypeEnum["Square"] = "square";
    DemoShapeTypeEnum["Triangle"] = "triangle";
})(DemoShapeTypeEnum || (DemoShapeTypeEnum = {}));
function calculateTrianglePoints(center, size) {
    const radius = size / 2;
    const angles = [
        (Math.PI * (90 + 120)) / 180,
        (Math.PI * (90 + 240)) / 180,
    ];
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
    ];
}
export const renderShapeStage = new VirLineStage({
    name: 'render shape',
    version: 1,
}, ({ state }) => {
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
    }
    else if (state.shape.type === DemoShapeTypeEnum.Circle) {
        state.renderContext.beginPath();
        state.renderContext.arc(canvasCenter.x, canvasCenter.y, size / 2, 0, Math.PI * 2);
        state.renderContext.fill();
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    }
    else if (state.shape.type === DemoShapeTypeEnum.Triangle) {
        state.renderContext.beginPath();
        const trianglePoints = calculateTrianglePoints(canvasCenter, size);
        state.renderContext.moveTo(trianglePoints[0][0], trianglePoints[0][1]);
        state.renderContext.lineTo(trianglePoints[1][0], trianglePoints[1][1]);
        state.renderContext.lineTo(trianglePoints[2][0], trianglePoints[2][1]);
        state.renderContext.fill();
    }
});
/** Intentionally cause a rendering stutter. */
export const renderStutterStage = new VirLineStage({
    name: 'render stutter',
    version: 1,
}, async ({ state }) => {
    if (!state.shouldStutter) {
        return;
    }
    await wait({ seconds: 1 });
    state.shouldStutter = false;
});
export const canvasSizeStage = new VirLineStage({
    name: 'canvas size',
    version: 1,
}, ({ state }) => {
    if (!state.canvas) {
        return;
    }
    state.canvasSize = {
        width: state.canvas.width,
        height: state.canvas.height,
    };
});
export const debugStage = new VirLineStage({
    name: 'debug',
    version: 1,
}, () => {
    console.info('render');
});
export const rainbowStage = new VirLineStage({
    name: 'rainbow',
    version: 1,
}, ({ state, timeSinceLastUpdate }) => {
    const newHue = wrapNumber(state.shape.color.h + timeSinceLastUpdate.milliseconds * state.shape.huePerMillisecond, {
        max: 360,
        min: 0,
    });
    state.shape.color.h = newHue;
});
