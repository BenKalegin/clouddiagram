import React from "react";
import Konva from "konva";
import { DiagramId } from "../diagramEditor/diagramEditorModel";
export interface StageHandler {
    getStage: () => Konva.Stage | null;
    setScale: (scale: number) => void;
    setPosition: (position: {
        x: number;
        y: number;
    }) => void;
    setViewport: (scale: number, position: {
        x: number;
        y: number;
    }) => void;
    getContainerDimensions: () => {
        width: number;
        height: number;
    } | null;
}
export interface ScrollHandler {
    scrollTo: (left: number, top: number) => void;
    getScrollPosition: () => {
        left: number;
        top: number;
    } | null;
}
interface DiagramStageProps {
    activeDiagramId: DiagramId;
    width: number;
    height: number;
    padding: number;
    onStageReady: (stageHandler: StageHandler, scrollHandler: ScrollHandler) => void;
}
export declare const DiagramStage: React.FC<DiagramStageProps>;
export {};
//# sourceMappingURL=DiagramStage.d.ts.map