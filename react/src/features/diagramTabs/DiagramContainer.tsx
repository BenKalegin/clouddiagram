import React, { useState, useCallback } from "react";
import { Box } from "@mui/material";
import { useAtom, useAtomValue } from "jotai";
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
    const [activeDiagramId] = useAtom(activeDiagramIdAtom);
    const diagramDisplay = useAtomValue(diagramDisplaySelector(activeDiagramId!));

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
        <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', minWidth: 0, minHeight: 0 }}>
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
            />
        </Box>
    );
};
