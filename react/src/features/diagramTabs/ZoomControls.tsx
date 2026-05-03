import React from "react";
import { Box, ButtonBase } from "@mui/material";
import { useAtomValue } from "jotai";
import { activeDiagramIdAtom } from "./diagramTabsModel";
import { diagramDisplaySelector } from "../diagramEditor/diagramEditorModel";
import { StageHandler } from "./DiagramStage";

interface ZoomControlsProps {
    scale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomToFit: () => void;
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

export const ZoomControls: React.FC<ZoomControlsProps> = ({ scale, onZoomIn, onZoomOut, onZoomToFit }) => {
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
            <ButtonBase sx={levelSx} onClick={onZoomToFit} title="Fit to screen">
                {Math.round(scale * 100)}%
            </ButtonBase>
            <ButtonBase sx={btnSx} onClick={onZoomIn} title="Zoom in">+</ButtonBase>
        </Box>
    );
};

export const useZoom = (stageHandler: StageHandler | null, WIDTH: number, HEIGHT: number) => {
    const activeDiagramId = useAtomValue(activeDiagramIdAtom);
    const diagramDisplay = useAtomValue(diagramDisplaySelector(activeDiagramId));

    // Use diagram's display property instead of React state
    const scale = diagramDisplay.scale;
    const position = diagramDisplay.offset;

    const applyZoom = (newScale: number) => {
        if (!stageHandler) return;

        const stage = stageHandler.getStage();
        if (!stage) return;

        const oldScale = stage.scaleX();

        // Keep the center of the view fixed when zooming
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

        // Use stageHandler to update scale and position at once (prevents race conditions)
        stageHandler.setViewport(newScale, newPos);
    };

    const handleZoomIn = () => {
        if (!stageHandler) return;
        // Define slider stops: 0.1, 0.2, ..., 5.0 (step 0.1)
        const stops = Array.from({ length: 50 }, (_, i) => +(0.1 + i * 0.1).toFixed(1));
        const currentIdx = stops.findIndex(s => Math.abs(s - scale) < 0.01);
        const nextIdx = Math.min(currentIdx + 1, stops.length - 1);
        const newScale = stops[nextIdx];
        applyZoom(newScale);
    };

    const handleZoomOut = () => {
        if (!stageHandler) return;
        const stops = Array.from({ length: 50 }, (_, i) => +(0.1 + i * 0.1).toFixed(1));
        const currentIdx = stops.findIndex(s => Math.abs(s - scale) < 0.01);
        const prevIdx = Math.max(currentIdx - 1, 0);
        const newScale = stops[prevIdx];
        applyZoom(newScale);
    };

    const handleZoomToFit = () => {
        if (!stageHandler) return;

        const stage = stageHandler.getStage();
        if (!stage) return;

        const dimensions = stageHandler.getContainerDimensions();
        if (!dimensions) return;

        // Calculate the scale to fit the content within the visible area
        const containerWidth = dimensions.width;
        const containerHeight = dimensions.height;

        const scaleX = containerWidth / WIDTH;
        const scaleY = containerHeight / HEIGHT;
        const newScale = Math.min(scaleX, scaleY);

        // Center the content
        const newPos = {
            x: (containerWidth - WIDTH * newScale) / 2,
            y: (containerHeight - HEIGHT * newScale) / 2,
        };

        // Use stageHandler to update scale and position at once (prevents race conditions)
        stageHandler.setViewport(newScale, newPos);
    };

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
        handleZoomToFit,
        handleSliderChange,
        applyZoom
    };
};
