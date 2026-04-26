import React from "react";
import { StageHandler } from "./DiagramStage";
interface ZoomControlsProps {
    scale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomToFit: () => void;
    onSliderChange: (event: Event, newValue: number | number[]) => void;
}
export declare const ZoomControls: React.FC<ZoomControlsProps>;
export declare const useZoom: (stageHandler: StageHandler | null, WIDTH: number, HEIGHT: number) => {
    scale: number;
    position: import("../../common/model").Coordinate;
    handleZoomIn: () => void;
    handleZoomOut: () => void;
    handleZoomToFit: () => void;
    handleSliderChange: (_event: Event, newValue: number | number[]) => void;
    applyZoom: (newScale: number) => void;
};
export {};
//# sourceMappingURL=ZoomControls.d.ts.map