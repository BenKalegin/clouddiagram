import React, { useRef, useEffect, useCallback } from "react";
import { Stage } from 'react-konva';
import Konva from "konva";
import { useRecoilValue } from "recoil";
import { diagramKindSelector, diagramDisplaySelector } from "../diagramEditor/diagramEditorModel";
import { ElementType } from "../../package/packageModel";
import { ClassDiagramEditor } from "../classDiagram/ClassDiagramEditor";
import { DeploymentDiagramEditor } from "../deploymentDiagram/DeploymentDiagramEditor";
import { SequenceDiagramEditor } from "../sequenceDiagram/SequenceDiagramEditor";
import { HtmlDrop } from "./HtmlDrop";
import { useRecoilBridgeAcrossReactRoots_UNSTABLE } from "recoil";
import { AppLayoutContext } from "../../app/appModel";
import { DiagramId } from "../diagramEditor/diagramEditorModel";
import { elementSelectedAction, updateDiagramDisplayAction, useDispatch } from "../diagramEditor/diagramEditorSlice";

// Define interfaces for handlers
export interface StageHandler {
    getStage: () => Konva.Stage | null;
    setScale: (scale: number) => void;
    setPosition: (position: { x: number, y: number }) => void;
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
    const diagramKind = useRecoilValue(diagramKindSelector(activeDiagramId));
    const diagramDisplay = useRecoilValue(diagramDisplaySelector(activeDiagramId));
    const dispatch = useDispatch();
    const Bridge = useRecoilBridgeAcrossReactRoots_UNSTABLE();

    // Create internal refs
    const stageRef = useRef<Konva.Stage>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateDimensions = () => {
            if (scrollContainerRef.current) {
                setDimensions({
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
                        stageRef.current.scale({ x: newScale, y: newScale });
                        stageRef.current.batchDraw();
                        dispatch(updateDiagramDisplayAction({
                            scale: newScale,
                            offset: position
                        }));
                    }
                },
                setPosition: (newPosition: { x: number, y: number }) => {
                    if (stageRef.current) {
                        stageRef.current.position(newPosition);
                        stageRef.current.batchDraw();
                        dispatch(updateDiagramDisplayAction({
                            scale,
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
    }, [onStageReady, dispatch, scale, position]);

    // Handle repositioning of the stage when scrolling
    const repositionStage = useCallback(() => {
        if (!scrollContainerRef.current || !containerRef.current) return;

        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const scrollTop = scrollContainerRef.current.scrollTop;

        const dx = scrollLeft - padding;
        const dy = scrollTop - padding;

        containerRef.current.style.transform = `translate(${dx}px, ${dy}px)`;

        const newPos = { x: -dx, y: -dy };

        dispatch(updateDiagramDisplayAction({
            scale,
            offset: newPos
        }));
    }, [scale, padding, dispatch]);

    // Set up a scroll event listener
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', repositionStage);
            return () => {
                scrollContainer.removeEventListener('scroll', repositionStage);
            };
        }
    }, [repositionStage]);

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
                    overflow: 'auto',
                    margin: '0px',
                    border: '0px solid grey',
                    position: 'relative'
                }}
            >
                {/* Spacer to define the virtual scrollable area */}
                <div 
                    style={{ 
                        width: (width + padding * 2) + 'px', 
                        height: (height + padding * 2) + 'px',
                        pointerEvents: 'none'
                    }} 
                />
                <div 
                    ref={containerRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        willChange: 'transform'
                    }}
                >
                    <HtmlDrop>
                        <AppLayoutContext.Consumer>
                            {value => (
                                <Stage
                                    width={dimensions.width > 0 ? dimensions.width + padding * 2 : 100}
                                    height={dimensions.height > 0 ? dimensions.height + padding * 2 : 100}
                                    onMouseDown={e => checkDeselect(e)}
                                    ref={stageRef}
                                    scaleX={scale}
                                    scaleY={scale}
                                    x={position.x}
                                    y={position.y}
                                    draggable={false} // Disable built-in dragging as we're using custom panning
                                >
                                    <Bridge>
                                        <AppLayoutContext.Provider value={value}>
                                            {diagramKind === ElementType.ClassDiagram && <ClassDiagramEditor diagramId={activeDiagramId} />}
                                            {diagramKind === ElementType.DeploymentDiagram && <DeploymentDiagramEditor diagramId={activeDiagramId} />}
                                            {diagramKind === ElementType.SequenceDiagram && <SequenceDiagramEditor diagramId={activeDiagramId} />}
                                        </AppLayoutContext.Provider>
                                    </Bridge>
                                </Stage>
                            )}
                        </AppLayoutContext.Consumer>
                    </HtmlDrop>
                </div>
            </div>
        </div>
    );
};
