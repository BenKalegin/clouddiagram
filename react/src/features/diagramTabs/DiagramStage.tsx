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

    // Create handlers for external components to interact with the stage
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

    // Notify parent when stage is ready
    useEffect(() => {
        if (stageRef.current && scrollContainerRef.current) {
            onStageReady(stageHandler, scrollHandler);
        }
    }, [onStageReady]);

    // Handle repositioning of stage when scrolling
    const repositionStage = useCallback(() => {
        if (!scrollContainerRef.current || !containerRef.current) return;

        const dx = scrollContainerRef.current.scrollLeft - padding;
        const dy = scrollContainerRef.current.scrollTop - padding;

        containerRef.current.style.transform = `translate(${dx}px, ${dy}px)`;

        const newPos = { x: -dx, y: -dy };

        dispatch(updateDiagramDisplayAction({
            scale,
            offset: newPos
        }));
    }, [scale, padding, dispatch]);

    // Set up scroll event listener
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
                width: width + 'px',
                height: height + 'px',
                overflow: 'hidden',
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
                }}
            >
                <div ref={containerRef}>
                    <HtmlDrop>
                        <AppLayoutContext.Consumer>
                            {value => (
                                <Stage
                                    width={scrollContainerRef.current ? scrollContainerRef.current.clientWidth + padding * 2 : width + padding * 2}
                                    height={scrollContainerRef.current ? scrollContainerRef.current.clientHeight + padding * 2 : height + padding * 2}
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
