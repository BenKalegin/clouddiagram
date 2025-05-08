import React, { useEffect } from "react";
import Konva from "konva";

interface PanZoomHandlerProps {
    stageRef: React.RefObject<Konva.Stage>;
    containerRef: React.RefObject<HTMLDivElement>;
    scrollContainerRef: React.RefObject<HTMLDivElement>;
    scale: number;
    setScale: (scale: number) => void;
    position: { x: number, y: number };
    setPosition: (position: { x: number, y: number }) => void;
    padding: number;
}

export const usePanZoomHandlers = ({
    stageRef,
    containerRef,
    scrollContainerRef,
    scale,
    setScale,
    position,
    setPosition,
    padding
}: PanZoomHandlerProps) => {
    // State for right-click panning
    const [isRightMouseDown, setIsRightMouseDown] = React.useState(false);
    const [lastPointerPosition, setLastPointerPosition] = React.useState<{ x: number, y: number } | null>(null);

    // Set up event handlers for right-click panning and wheel zooming
    useEffect(() => {
        if (!stageRef.current || !containerRef.current) return;

        const stage = stageRef.current;
        const container = stage.container();
        const scrollContainer = containerRef.current;

        // Handle right mouse button down
        const handleMouseDown = (e: MouseEvent) => {
            // Right mouse button (button === 2)
            if (e.button === 2) {
                e.preventDefault();
                setIsRightMouseDown(true);
                setLastPointerPosition({
                    x: e.clientX,
                    y: e.clientY
                });
                // Change cursor to grabbing
                container.style.cursor = 'grabbing';
            }
        };

        // Handle mouse move for panning
        const handleMouseMove = (e: MouseEvent) => {
            if (isRightMouseDown && lastPointerPosition) {
                e.preventDefault();
                const dx = e.clientX - lastPointerPosition.x;
                const dy = e.clientY - lastPointerPosition.y;

                const newPos = {
                    x: stage.x() + dx,
                    y: stage.y() + dy
                };

                stage.position(newPos);
                stage.batchDraw();
                setPosition(newPos);

                setLastPointerPosition({
                    x: e.clientX,
                    y: e.clientY
                });
            }
        };

        // Handle mouse up to stop panning
        const handleMouseUp = (e: MouseEvent) => {
            if (e.button === 2) {
                setIsRightMouseDown(false);
                setLastPointerPosition(null);
                // Reset cursor
                container.style.cursor = 'default';
            }
        };

        // Handle context menu to prevent it from showing
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        // Handle wheel event for zooming
        const handleWheel = (e: WheelEvent) => {
            // Prevent default scrolling behavior
            e.preventDefault();
            e.stopPropagation();

            const oldScale = stage.scaleX();

            // Get pointer position
            const pointer = stage.getPointerPosition();
            if (!pointer) return;

            const mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
            };

            // Calculate new scale
            // Zoom in: scale up, Zoom out: scale down
            const direction = e.deltaY > 0 ? -1 : 1;
            const scaleBy = 1.1;
            const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

            // Limit scale to reasonable bounds
            const limitedScale = Math.max(0.1, Math.min(newScale, 5));

            // Set new scale
            stage.scale({ x: limitedScale, y: limitedScale });

            // Calculate new position
            const newPos = {
                x: pointer.x - mousePointTo.x * limitedScale,
                y: pointer.y - mousePointTo.y * limitedScale,
            };

            // Set new position
            stage.position(newPos);
            stage.batchDraw();

            // Update state
            setScale(limitedScale);
            setPosition(newPos);
        };

        // Prevent wheel events on the scroll container from scrolling
        const preventWheelScroll = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                // Allow pinch-to-zoom on trackpads
                e.preventDefault();
            }
        };

        function repositionStage() {
            if (!scrollContainerRef.current) return;
            
            const dx = scrollContainerRef.current.scrollLeft - padding;
            const dy = scrollContainerRef.current.scrollTop - padding;
            if (containerRef.current) {
                containerRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
            }
            setPosition({ x: -dx, y: -dy });
        }

        // Add event listeners
        container.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        container.addEventListener('contextmenu', handleContextMenu);
        container.addEventListener('wheel', handleWheel);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.addEventListener('wheel', preventWheelScroll, { passive: false });
            scrollContainerRef.current.addEventListener('scroll', repositionStage);
        }
        repositionStage();

        // Clean up event listeners
        return () => {
            container.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            container.removeEventListener('contextmenu', handleContextMenu);
            container.removeEventListener('wheel', handleWheel);
            if (scrollContainerRef.current) {
                scrollContainerRef.current.removeEventListener('wheel', preventWheelScroll);
                scrollContainerRef.current.removeEventListener('scroll', repositionStage);
            }
        };
    }, [isRightMouseDown, lastPointerPosition, scale, stageRef, containerRef, scrollContainerRef, setPosition, setScale, padding]);

    return {
        isRightMouseDown,
        lastPointerPosition
    };
};