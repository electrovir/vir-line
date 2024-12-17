import { VirLine } from 'vir-line';
import { DemoShapeTypeEnum, canvasSizeStage, rainbowStage, renderShapeStage, renderStutterStage, } from './demo-stages.js';
export function createDemoPipeline() {
    return new VirLine([
        canvasSizeStage,
        renderShapeStage,
        // debugStage,
        rainbowStage,
        renderStutterStage,
    ], {
        shape: {
            color: {
                h: 0,
                s: 100,
                l: 50,
            },
            huePerMillisecond: 0.1,
            type: DemoShapeTypeEnum.Triangle,
        },
        canvasSize: {
            width: 0,
            height: 0,
        },
        shouldStutter: false,
        canvas: undefined,
        renderContext: undefined,
    });
}
