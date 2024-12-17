import { VirLine } from 'vir-line';
import { DemoShapeTypeEnum } from './demo-stages.js';
export type DemoPipeline = ReturnType<typeof createDemoPipeline>;
export type DemoState = DemoPipeline['stateType'];
export declare function createDemoPipeline(): VirLine<readonly [import("vir-line").VirLineStage<{
    canvasSize: {
        height: number;
        width: number;
    };
    canvas: Pick<HTMLCanvasElement, "height" | "width"> | undefined;
}>, import("vir-line").VirLineStage<{
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
    renderContext: Pick<CanvasRenderingContext2D, "fillStyle" | "fillRect" | "beginPath" | "arc" | "fill" | "moveTo" | "lineTo"> | undefined;
}>, import("vir-line").VirLineStage<{
    shape: {
        color: {
            h: number;
            s: number;
            l: number;
        };
        huePerMillisecond: number;
    };
}>, import("vir-line").VirLineStage<{
    shouldStutter: boolean;
}>]>;
