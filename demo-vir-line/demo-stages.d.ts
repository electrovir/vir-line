import { VirLineStage } from 'vir-line';
export declare enum DemoShapeTypeEnum {
    Circle = "circle",
    Square = "square",
    Triangle = "triangle"
}
export declare const renderShapeStage: VirLineStage<{
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
}>;
/** Intentionally cause a rendering stutter. */
export declare const renderStutterStage: VirLineStage<{
    shouldStutter: boolean;
}>;
export declare const canvasSizeStage: VirLineStage<{
    canvasSize: {
        height: number;
        width: number;
    };
    canvas: Pick<HTMLCanvasElement, "height" | "width"> | undefined;
}>;
export declare const debugStage: VirLineStage<import("type-fest").EmptyObject>;
export declare const rainbowStage: VirLineStage<{
    shape: {
        color: {
            h: number;
            s: number;
            l: number;
        };
        huePerMillisecond: number;
    };
}>;
