import React from "react";
import { Stack, Slider, IconButton, Typography } from "@mui/material";
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import { useRecoilValue } from "recoil";
import { activeDiagramIdAtom } from "./diagramTabsModel";
import { diagramDisplaySelector } from "../diagramEditor/diagramEditorModel";
import { StageHandler } from "./DiagramStage";

interface ZoomControlsProps {
    scale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomToFit: () => void;
    onSliderChange: (event: Event, newValue: number | number[]) => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
    scale,
    onZoomIn,
    onZoomOut,
    onZoomToFit,
    onSliderChange
}) => {
    return (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
            <IconButton onClick={onZoomOut} size="small">
                <ZoomOutIcon />
            </IconButton>

            <Slider
                value={scale}
                min={0.1}
                max={5}
                step={0.1}
                onChange={onSliderChange}
                aria-labelledby="zoom-slider"
                sx={{ width: 200 }}
            />

            <IconButton onClick={onZoomIn} size="small">
                <ZoomInIcon />
            </IconButton>

            <IconButton onClick={onZoomToFit} size="small">
                <FitScreenIcon />
            </IconButton>

            <Typography variant="body2">
                {Math.round(scale * 100)}%
            </Typography>
        </Stack>
    );
};

export const useZoom = (stageHandler: StageHandler | null, WIDTH: number, HEIGHT: number) => {
    const activeDiagramId = useRecoilValue(activeDiagramIdAtom);
    const diagramDisplay = useRecoilValue(diagramDisplaySelector(activeDiagramId));

    // Use diagram's display property instead of React state
    const scale = diagramDisplay.scale;
    const position = diagramDisplay.offset;

    const applyZoom = (newScale: number) => {
        if (!stageHandler) return;

        const stage = stageHandler.getStage();
        if (!stage) return;

        const oldScale = stage.scaleX();

        // Keep the center of the view fixed when zooming
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const mousePointTo = {
            x: (centerX - stage.x()) / oldScale,
            y: (centerY - stage.y()) / oldScale,
        };

        const newPos = {
            x: centerX - mousePointTo.x * newScale,
            y: centerY - mousePointTo.y * newScale,
        };

        // Use stageHandler to update scale and position
        stageHandler.setScale(newScale);
        stageHandler.setPosition(newPos);
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

        // Use stageHandler to update scale and position
        stageHandler.setScale(newScale);
        stageHandler.setPosition(newPos);
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
