import { DemoShapeTypeEnum } from '../../demo-vir-line/demo-stages.js';
export declare const VirControls: import("element-vir").DeclarativeElementDefinition<"vir-controls", {
    isPaused: boolean;
    currentShapeType: DemoShapeTypeEnum;
}, {}, {
    playPipeline: import("element-vir").DefineEvent<boolean>;
    newShape: import("element-vir").DefineEvent<DemoShapeTypeEnum>;
    stutter: import("element-vir").DefineEvent<void>;
}, "vir-controls-", "vir-controls-", readonly []>;
