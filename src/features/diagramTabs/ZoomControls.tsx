import React, { useCallback } from "react";
import { Box, ButtonBase } from "@mui/material";
import { useAtomValue } from "jotai";
import { activeDiagramIdAtom } from "./diagramTabsModel";
import { diagramDisplaySelector } from "../diagramEditor/diagramEditorModel";
import { StageHandler } from "./DiagramStage";

interface ZoomControlsProps {
    scale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
    onFitToScreen: () => void;
}

const btnSx = {
    width: 28,
    height: 24,
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 600,
    color: 'text.secondary',
    opacity: 0.7,
    transition: 'opacity 0.15s, background 0.15s',
    '&:hover': { opacity: 1, bgcolor: 'action.hover' },
} as const;

const levelSx = {
    minWidth: 44,
    height: 24,
    borderRadius: '4px',
    fontSize: '11px',
    color: 'text.disabled',
    transition: 'background 0.15s, color 0.15s',
    '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
} as const;

const FitIcon = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8"/>
    </svg>
);

export const ZoomControls: React.FC<ZoomControlsProps> = ({ scale, onZoomIn, onZoomOut, onZoomReset, onFitToScreen }) => {
    return (
        <Box sx={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            display: 'flex',
            gap: '2px',
            zIndex: 20,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '6px',
            padding: '2px',
        }}>
            <ButtonBase sx={btnSx} onClick={onZoomOut} title="Zoom out">−</ButtonBase>
            <ButtonBase sx={levelSx} onClick={onZoomReset} title="Reset to 100%">
                {Math.round(scale * 100)}%
            </ButtonBase>
            <ButtonBase sx={btnSx} onClick={onZoomIn} title="Zoom in">+</ButtonBase>
            <ButtonBase sx={btnSx} onClick={onFitToScreen} title="Fit to screen">
                <FitIcon />
            </ButtonBase>
        </Box>
    );
};

export const useZoom = (stageHandler: StageHandler | null, WIDTH: number, HEIGHT: number) => {
    const activeDiagramId = useAtomValue(activeDiagramIdAtom);
    const diagramDisplay = useAtomValue(diagramDisplaySelector(activeDiagramId));

    const scale = diagramDisplay.scale;
    const position = diagramDisplay.offset;

    const applyZoom = (newScale: number) => {
        if (!stageHandler) return;

        const stage = stageHandler.getStage();
        if (!stage) return;

        const oldScale = stage.scaleX();

        const dimensions = stageHandler.getContainerDimensions();
        if (!dimensions) return;

        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;

        const mousePointTo = {
            x: (centerX - position.x) / oldScale,
            y: (centerY - position.y) / oldScale,
        };

        const newPos = {
            x: centerX - mousePointTo.x * newScale,
            y: centerY - mousePointTo.y * newScale,
        };

        stageHandler.setViewport(newScale, newPos);
    };

    const handleZoomIn = () => {
        if (!stageHandler) return;
        const stops = Array.from({ length: 50 }, (_, i) => +(0.1 + i * 0.1).toFixed(1));
        const currentIdx = stops.findIndex(s => Math.abs(s - scale) < 0.01);
        if (currentIdx === -1) {
            const next = stops.find(s => s > scale + 0.001);
            if (next) applyZoom(next);
            return;
        }
        applyZoom(stops[Math.min(currentIdx + 1, stops.length - 1)]);
    };

    const handleZoomOut = () => {
        if (!stageHandler) return;
        const stops = Array.from({ length: 50 }, (_, i) => +(0.1 + i * 0.1).toFixed(1));
        const currentIdx = stops.findIndex(s => Math.abs(s - scale) < 0.01);
        if (currentIdx === -1) {
            const prev = [...stops].reverse().find(s => s < scale - 0.001);
            if (prev) applyZoom(prev);
            return;
        }
        applyZoom(stops[Math.max(currentIdx - 1, 0)]);
    };

    const handleZoomTo100 = () => {
        if (!stageHandler) return;
        const dimensions = stageHandler.getContainerDimensions();
        if (!dimensions) return;
        stageHandler.setViewport(1, {
            x: (dimensions.width - WIDTH) / 2,
            y: (dimensions.height - HEIGHT) / 2,
        });
    };

    // Memoized so that effects depending on `handleZoomToFit` (e.g. the
    // fit-on-mount effect in DiagramContainer) don't re-fire on every render
    // — that previously cleared the scheduled fit timeout repeatedly during
    // hydration, leaving the diagram un-fit at scale=1.
    const handleZoomToFit = useCallback(() => {
        if (!stageHandler) return;

        const stage = stageHandler.getStage();
        if (!stage) return;

        const dimensions = stageHandler.getContainerDimensions();
        if (!dimensions) return;

        const containerWidth = dimensions.width;
        const containerHeight = dimensions.height;

        const scaleX = containerWidth / WIDTH;
        const scaleY = containerHeight / HEIGHT;
        const newScale = Math.min(scaleX, scaleY);

        stageHandler.setViewport(newScale, {
            x: (containerWidth - WIDTH * newScale) / 2,
            y: (containerHeight - HEIGHT * newScale) / 2,
        });
    }, [stageHandler, WIDTH, HEIGHT]);

    const handleSliderChange = (_event: Event, newValue: number | number[]) => {
        if (!stageHandler) return;
        if (typeof newValue === 'number') {
            applyZoom(newValue);
        }
    };

    return {
        scale,
        position,
        handleZoomIn,
        handleZoomOut,
        handleZoomTo100,
        handleZoomToFit,
        handleSliderChange,
        applyZoom
    };
};
