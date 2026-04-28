import React, { useRef, useEffect, useCallback } from "react";
import { Stage } from 'react-konva';
import Konva from "konva";
import { useAtomValue, useStore, Provider as JotaiProvider } from "jotai";
import { diagramKindSelector, diagramDisplaySelector } from "../diagramEditor/diagramEditorModel";
import { HtmlDrop } from "./HtmlDrop";
import { AppLayoutContext } from "../../editor/editorLayout";
import { DiagramId } from "../diagramEditor/diagramEditorModel";
import { elementSelectedAction, updateDiagramDisplayAction, useDispatch } from "../diagramEditor/diagramEditorSlice";
import {getDiagramEditor} from "../diagramTypes/diagramEditorRegistry";

// Define interfaces for handlers
export interface StageHandler {
    getStage: () => Konva.Stage | null;
    setScale: (scale: number) => void;
    setPosition: (position: { x: number, y: number }) => void;
    setViewport: (scale: number, position: { x: number, y: number }) => void;
    getContainerDimensions: () => { width: number, height: number } | null;
}

export interface ScrollHandler {
    scrollTo: (left: number, top: number) => void;
    getScrollPosition: () => { left: number, top: number } | null;
}

interface DiagramStageProps {
    activeDiagramId: DiagramId;
    width: number;
    height: number;
    padding: number;
    onStageReady: (stageHandler: StageHandler, scrollHandler: ScrollHandler) => void;
}

export const DiagramStage: React.FC<DiagramStageProps> = ({
    activeDiagramId,
    width,
    height,
    padding,
    onStageReady
}) => {
    const diagramKind = useAtomValue(diagramKindSelector(activeDiagramId));
    const DiagramEditor = getDiagramEditor(diagramKind);
    const diagramDisplay = useAtomValue(diagramDisplaySelector(activeDiagramId));
    const dispatch = useDispatch();
    const jotaiStore = useStore();

    // Create internal refs
    const stageRef = useRef<Konva.Stage>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Dimensions state is no longer used for Stage size, but can be used for calculations
    const [viewportDimensions, setViewportDimensions] = React.useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateDimensions = () => {
            if (scrollContainerRef.current) {
                setViewportDimensions({
                    width: scrollContainerRef.current.clientWidth,
                    height: scrollContainerRef.current.clientHeight
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const scale = diagramDisplay.scale;
    const position = diagramDisplay.offset;

    // Use effective padding to allow diagram to disappear in all directions
    const effPaddingX = Math.max(padding, viewportDimensions.width);
    const effPaddingY = Math.max(padding, viewportDimensions.height);

    // Keep refs for handlers to avoid frequent re-creation while still having access to latest values
    const scaleRef = useRef(scale);
    scaleRef.current = scale;
    const positionRef = useRef(position);
    positionRef.current = position;
    const effPaddingXRef = useRef(effPaddingX);
    effPaddingXRef.current = effPaddingX;
    const effPaddingYRef = useRef(effPaddingY);
    effPaddingYRef.current = effPaddingY;

    const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // deselect when clicked on an empty area
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            dispatch(elementSelectedAction({
                element: undefined,
                shiftKey: e.evt.shiftKey,
                ctrlKey: e.evt.ctrlKey
            }));
        }
    };

    // Notify parent when the stage is ready
    useEffect(() => {
        if (stageRef.current && scrollContainerRef.current) {
            // Create handlers inside the effect to avoid recreating on every render
            const stageHandler: StageHandler = {
                getStage: () => stageRef.current,
                setScale: (newScale: number) => {
                    if (stageRef.current) {
                        dispatch(updateDiagramDisplayAction({
                            scale: newScale,
                            offset: positionRef.current
                        }));
                    }
                },
                setPosition: (newPosition: { x: number, y: number }) => {
                    if (scrollContainerRef.current) {
                        // Update scroll position instead of stage position
                        scrollContainerRef.current.scrollLeft = effPaddingXRef.current - newPosition.x;
                        scrollContainerRef.current.scrollTop = effPaddingYRef.current - newPosition.y;

                        dispatch(updateDiagramDisplayAction({
                            scale: scaleRef.current,
                            offset: newPosition
                        }));
                    }
                },
                setViewport: (newScale: number, newPosition: { x: number, y: number }) => {
                    if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollLeft = effPaddingXRef.current - newPosition.x;
                        scrollContainerRef.current.scrollTop = effPaddingYRef.current - newPosition.y;

                        dispatch(updateDiagramDisplayAction({
                            scale: newScale,
                            offset: newPosition
                        }));
                    }
                },
                getContainerDimensions: () => {
                    if (scrollContainerRef.current) {
                        return {
                            width: scrollContainerRef.current.clientWidth,
                            height: scrollContainerRef.current.clientHeight
                        };
                    }
                    return null;
                }
            };

            const scrollHandler: ScrollHandler = {
                scrollTo: (left: number, top: number) => {
                    if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollLeft = left;
                        scrollContainerRef.current.scrollTop = top;
                    }
                },
                getScrollPosition: () => {
                    if (scrollContainerRef.current) {
                        return {
                            left: scrollContainerRef.current.scrollLeft,
                            top: scrollContainerRef.current.scrollTop
                        };
                    }
                    return null;
                }
            };

            onStageReady(stageHandler, scrollHandler);
        }
        // Only run when refs are set
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onStageReady, dispatch, padding, activeDiagramId]);

    // Update the store with the new scroll position
    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current) return;

        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const scrollTop = scrollContainerRef.current.scrollTop;

        const newPos = {
            x: effPaddingX - scrollLeft,
            y: effPaddingY - scrollTop
        };

        dispatch(updateDiagramDisplayAction({
            scale,
            offset: newPos
        }));
    }, [scale, effPaddingX, effPaddingY, dispatch]);

    // Set up a scroll event listener
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll);
            return () => {
                scrollContainer.removeEventListener('scroll', handleScroll);
            };
        }
    }, [handleScroll]);

    // Sync scroll position only on diagram switch or viewport resize. Reading
    // position via ref instead of via deps avoids the per-scroll feedback loop:
    // each scroll event dispatches a position update, which would otherwise
    // re-fire this effect and write a slightly-different scroll value back,
    // causing oscillation with subpixel rounding.
    useEffect(() => {
        if (!scrollContainerRef.current) return;
        const targetLeft = effPaddingX - positionRef.current.x;
        const targetTop = effPaddingY - positionRef.current.y;

        if (Math.abs(scrollContainerRef.current.scrollLeft - targetLeft) > 1 ||
            Math.abs(scrollContainerRef.current.scrollTop - targetTop) > 1) {
            scrollContainerRef.current.scrollLeft = targetLeft;
            scrollContainerRef.current.scrollTop = targetTop;
        }
    }, [activeDiagramId, effPaddingX, effPaddingY, viewportDimensions.width, viewportDimensions.height]);

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                flex: 1,
                position: 'relative',
                minWidth: 0,
                minHeight: 0
            }}
        >
            <div
                ref={scrollContainerRef}
                style={{
                    width: '100%',
                    height: '100%',
                    overflow: 'scroll',
                    margin: '0px',
                    border: '0px solid grey',
                    position: 'relative'
                }}
            >
                <div
                    ref={containerRef}
                    style={{
                        position: 'relative',
                        width: (width * scale + effPaddingX + (viewportDimensions.width || 0)) + 'px',
                        height: (height * scale + effPaddingY + (viewportDimensions.height || 0)) + 'px'
                    }}
                >
                    <div
                        style={{
                            position: 'sticky',
                            top: 0,
                            left: 0,
                            width: viewportDimensions.width || '100%',
                            height: viewportDimensions.height || '100%',
                            overflow: 'hidden'
                        }}
                    >
                        <HtmlDrop>
                            <AppLayoutContext.Consumer>
                                {value => (
                                    <Stage
                                        width={viewportDimensions.width || 1}
                                        height={viewportDimensions.height || 1}
                                        onMouseDown={e => checkDeselect(e)}
                                        ref={stageRef}
                                        scaleX={scale}
                                        scaleY={scale}
                                        x={position.x}
                                        y={position.y}
                                        draggable={false} // Disable built-in dragging as we're using custom panning
                                    >
                                    <JotaiProvider store={jotaiStore}>
                                        <AppLayoutContext.Provider value={value}>
                                            <DiagramEditor diagramId={activeDiagramId} />
                                        </AppLayoutContext.Provider>
                                    </JotaiProvider>
                                </Stage>
                            )}
                        </AppLayoutContext.Consumer>
                    </HtmlDrop>
                    </div>
                </div>
            </div>
        </div>
    );
};
