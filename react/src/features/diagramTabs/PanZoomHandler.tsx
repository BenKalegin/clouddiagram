import React, {useEffect} from "react";
import {useRecoilValue} from "recoil";
import {activeDiagramIdAtom} from "./diagramTabsModel";
import {useDispatch} from "../diagramEditor/diagramEditorSlice";
import {StageHandler, ScrollHandler} from "./DiagramStage";

interface PanZoomHandlerProps {
    stageHandler: StageHandler | null;
    scrollHandler: ScrollHandler | null;
    scale: number;
    position: { x: number, y: number };
    padding: number;
}

export const usePanZoomHandlers = ({
    stageHandler,
    scrollHandler,
    scale,
    position,
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

    // Set up event handlers for right-click panning and wheel zooming
    useEffect(() => {
        // Early return if handlers are null
        if (!stageHandler || !scrollHandler) return;

        const stage = stageHandler.getStage();
        if (!stage) return;

        const container = stage.container();
        const scrollPosition = scrollHandler.getScrollPosition();
        if (!scrollPosition) return;

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

                const currentStage = stageHandler.getStage();
                if (!currentStage) return;

                const newPos = {
                    x: currentStage.x() + dx,
                    y: currentStage.y() + dy
                };

                // Use stageHandler to update position
                stageHandler.setPosition(newPos);

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

        // Handle a context menu to prevent it from showing
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        // Handle wheel event for scrolling and zooming
        const handleWheel = (e: WheelEvent) => {
            // If the Ctrl key is pressed, handle zooming
            if (e.ctrlKey || e.metaKey) {
                // Prevent default scrolling behavior
                e.preventDefault();
                e.stopPropagation();

                const currentStage = stageHandler.getStage();
                if (!currentStage) return;

                const oldScale = currentStage.scaleX();

                // Get pointer position
                const pointer = currentStage.getPointerPosition();
                if (!pointer) return;

                const mousePointTo = {
                    x: (pointer.x - currentStage.x()) / oldScale,
                    y: (pointer.y - currentStage.y()) / oldScale,
                };

                // Calculate a new scale
                // Zoom in: scale up, Zoom out: scale down
                const direction = e.deltaY > 0 ? -1 : 1;
                const scaleBy = 1.1;
                const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

                // Limit scale to reasonable bounds
                const limitedScale = Math.max(0.1, Math.min(newScale, 5));

                // Calculate a new position
                const newPos = {
                    x: pointer.x - mousePointTo.x * limitedScale,
                    y: pointer.y - mousePointTo.y * limitedScale,
                };

                // Use stageHandler to update scale and position
                stageHandler.setScale(limitedScale);
                stageHandler.setPosition(newPos);
            }
            // If a Shift key is pressed, handle horizontal scrolling
            else if (e.shiftKey) {
                // Prevent default scrolling behavior
                e.preventDefault();
                e.stopPropagation();

                // Scroll horizontally
                const scrollPosition = scrollHandler.getScrollPosition();
                if (scrollPosition) {
                    // noinspection JSSuspiciousNameCombination
                    scrollHandler.scrollTo(scrollPosition.left + e.deltaY, scrollPosition.top);
                }
            }
            // Otherwise, let the default vertical scrolling happen
            // No need to prevent default or stop propagation
        };

        // Add event listeners
        container.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        container.addEventListener('contextmenu', handleContextMenu);
        container.addEventListener('wheel', handleWheel);

        // Note: scroll event listeners are now handled inside the DiagramStage component

        // Cleanup event listeners
        return () => {
            container.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            container.removeEventListener('contextmenu', handleContextMenu);
            container.removeEventListener('wheel', handleWheel);

            // Note: scroll event listeners cleanup is now handled inside the DiagramStage component
        };
    }, [scale, stageHandler, scrollHandler, padding, position, dispatch, activeDiagramId]);

    return {
        isRightMouseDown,
        lastPointerPosition
    };
};
