import React, { useEffect } from "react";
import Konva from "konva";
import { useRecoilValue } from "recoil";
import { activeDiagramIdAtom } from "./diagramTabsModel";
import { updateDiagramDisplayAction, useDispatch } from "../diagramEditor/diagramEditorSlice";

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
    const activeDiagramId = useRecoilValue(activeDiagramIdAtom);
    const dispatch = useDispatch();
    // Refs for right-click panning (using refs instead of state for immediate updates)
    const isRightMouseDownRef = React.useRef(false);
    const lastPointerPositionRef = React.useRef<{ x: number, y: number } | null>(null);

    // State for right-click panning (for component re-rendering)
    const [isRightMouseDown, setIsRightMouseDown] = React.useState(false);
    const [lastPointerPosition, setLastPointerPosition] = React.useState<{ x: number, y: number } | null>(null);

    // Ref to track the initial setup
    const initialSetupDoneRef = React.useRef(false);

    // Ref to track previous position to avoid unnecessary updates
    const prevPositionRef = React.useRef(position);

    // Set up event handlers for right-click panning and wheel zooming
    useEffect(() => {
        if (!stageRef.current || !containerRef.current || !scrollContainerRef.current) return;

        const stage = stageRef.current;
        const container = stage.container();
        const scrollContainer = scrollContainerRef.current;

        // Handle right mouse button down
        const handleMouseDown = (e: MouseEvent) => {
            // Right mouse button (button === 2)
            if (e.button === 2) {
                e.preventDefault();
                // Update both ref and state
                isRightMouseDownRef.current = true;
                setIsRightMouseDown(true);

                const newPosition = {
                    x: e.clientX,
                    y: e.clientY
                };
                // Update both ref and state
                lastPointerPositionRef.current = newPosition;
                setLastPointerPosition(newPosition);

                // Change cursor to grabbing
                container.style.cursor = 'grabbing';
            }
        };

        // Handle mouse move for panning
        const handleMouseMove = (e: MouseEvent) => {
            // Use refs for immediate access to current values
            if (isRightMouseDownRef.current && lastPointerPositionRef.current) {
                e.preventDefault();
                const dx = e.clientX - lastPointerPositionRef.current.x;
                const dy = e.clientY - lastPointerPositionRef.current.y;

                const newPos = {
                    x: stage.x() + dx,
                    y: stage.y() + dy
                };

                stage.position(newPos);
                stage.batchDraw();

                // Update diagram's display property
                dispatch(updateDiagramDisplayAction({
                    scale,
                    offset: newPos
                }));

                const newPointerPosition = {
                    x: e.clientX,
                    y: e.clientY
                };
                // Update both ref and state
                lastPointerPositionRef.current = newPointerPosition;
                setLastPointerPosition(newPointerPosition);
            }
        };

        // Handle mouse up to stop panning
        const handleMouseUp = (e: MouseEvent) => {
            if (e.button === 2) {
                // Update both ref and state
                isRightMouseDownRef.current = false;
                setIsRightMouseDown(false);

                lastPointerPositionRef.current = null;
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

            // Update diagram's display property
            dispatch(updateDiagramDisplayAction({
                scale: limitedScale,
                offset: newPos
            }));
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
            const newPos = { x: -dx, y: -dy };

            // Only update if position has changed
            if (prevPositionRef.current.x !== newPos.x || prevPositionRef.current.y !== newPos.y) {
                prevPositionRef.current = newPos;

                // Update diagram's display property
                dispatch(updateDiagramDisplayAction({
                    scale,
                    offset: newPos
                }));
            }
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

        // Only call repositionStage on initial setup
        if (!initialSetupDoneRef.current) {
            initialSetupDoneRef.current = true;
            repositionStage();
        }

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
    }, [scale, stageRef, containerRef, scrollContainerRef, setPosition, setScale, padding, position, dispatch, activeDiagramId]);

    return {
        isRightMouseDown,
        lastPointerPosition
    };
};
