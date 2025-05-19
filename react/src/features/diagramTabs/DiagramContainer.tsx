import React, { useState, useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import {
    diagramDisplaySelector,
} from "../diagramEditor/diagramEditorModel";
import { activeDiagramIdAtom } from "./diagramTabsModel";
import { useZoom } from "./ZoomControls";
import { usePanZoomHandlers } from "./PanZoomHandler";
import { useKeyboardShortcuts } from "./KeyboardShortcutsHandler";
import { DiagramStage, StageHandler, ScrollHandler } from "./DiagramStage";
import { ZoomControls } from "./ZoomControls";

export const DiagramContainer = () => {
    const [activeDiagramId] = useRecoilState(activeDiagramIdAtom);
    const diagramDisplay = useRecoilValue(diagramDisplaySelector(activeDiagramId!));

    const [stageHandler, setStageHandler] = useState<StageHandler | null>(null);
    const [scrollHandler, setScrollHandler] = useState<ScrollHandler | null>(null);

    const PADDING = 500;

    const handleStageReady = useCallback((newStageHandler: StageHandler, newScrollHandler: ScrollHandler) => {
        setStageHandler(newStageHandler);
        setScrollHandler(newScrollHandler);
    }, []);

    const {
        handleZoomIn,
        handleZoomOut,
        handleZoomToFit,
        handleSliderChange
    } = useZoom(
        stageHandler,
        diagramDisplay.width || 3000,
        diagramDisplay.height || 3000
    );

    usePanZoomHandlers({
        stageHandler,
        scrollHandler,
        scale: diagramDisplay.scale,
        position: diagramDisplay.offset,
        padding: PADDING
    });

    useKeyboardShortcuts({ activeDiagramId });

    return (
        <>
            <DiagramStage
                activeDiagramId={activeDiagramId!}
                width={diagramDisplay.width || 3000}
                height={diagramDisplay.height || 3000}
                padding={PADDING}
                onStageReady={handleStageReady}
            />
            <ZoomControls
                scale={diagramDisplay?.scale ?? 1}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onZoomToFit={handleZoomToFit}
                onSliderChange={handleSliderChange}
            />
        </>
    );
};
