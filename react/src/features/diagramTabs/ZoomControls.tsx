import React from "react";
import { Stack, Slider, IconButton, Typography } from "@mui/material";
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import Konva from "konva";

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

export const useZoom = (stageRef: React.RefObject<Konva.Stage>, scrollContainerRef: React.RefObject<HTMLDivElement>, WIDTH: number, HEIGHT: number) => {
    const [scale, setScale] = React.useState(1);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });

    const applyZoom = (newScale: number) => {
        if (!stageRef.current) return;

        const stage = stageRef.current;
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

        stage.scale({ x: newScale, y: newScale });
        stage.position(newPos);
        stage.batchDraw();

        setScale(newScale);
        setPosition(newPos);
    };

    const handleZoomIn = () => {
        const newScale = Math.min(scale * 1.2, 5);
        applyZoom(newScale);
    };

    const handleZoomOut = () => {
        const newScale = Math.max(scale / 1.2, 0.1);
        applyZoom(newScale);
    };

    const handleZoomToFit = () => {
        if (!stageRef.current) return;

        const stage = stageRef.current;
        const container = scrollContainerRef.current;
        if (!container) return;

        // Calculate the scale to fit the content within the visible area
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;

        const scaleX = containerWidth / WIDTH;
        const scaleY = containerHeight / HEIGHT;
        const newScale = Math.min(scaleX, scaleY);

        // Center the content
        const newPos = {
            x: (containerWidth - WIDTH * newScale) / 2,
            y: (containerHeight - HEIGHT * newScale) / 2,
        };

        stage.scale({ x: newScale, y: newScale });
        stage.position(newPos);
        stage.batchDraw();

        setScale(newScale);
        setPosition(newPos);
    };

    const handleSliderChange = (_event: Event, newValue: number | number[]) => {
        if (typeof newValue === 'number') {
            applyZoom(newValue);
        }
    };

    return {
        scale,
        position,
        setScale,
        setPosition,
        handleZoomIn,
        handleZoomOut,
        handleZoomToFit,
        handleSliderChange,
        applyZoom
    };
};