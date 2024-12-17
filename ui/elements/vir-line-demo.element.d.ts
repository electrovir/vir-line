import { RemoveListenerCallback } from 'vir-line';
import { DemoShapeTypeEnum } from '../../demo-vir-line/demo-stages.js';
export declare const VirLineDemo: import("element-vir").DeclarativeElementDefinition<"vir-line-demo", {}, {
    pipeline: import("vir-line").VirLine<readonly [import("vir-line").VirLineStage<{
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
    pipelineListenerRemovers: RemoveListenerCallback[];
    isPaused: boolean;
    currentShapeType: DemoShapeTypeEnum;
    error: Error | undefined;
    framerate: number;
}, {}, "vir-line-demo-", "vir-line-demo-", readonly []>;
