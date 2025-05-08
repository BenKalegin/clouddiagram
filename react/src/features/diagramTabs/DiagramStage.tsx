import React from "react";
import { Stage } from 'react-konva';
import Konva from "konva";
import { useRecoilValue } from "recoil";
import { diagramKindSelector } from "../diagramEditor/diagramEditorModel";
import { ElementType } from "../../package/packageModel";
import { ClassDiagramEditor } from "../classDiagram/ClassDiagramEditor";
import { DeploymentDiagramEditor } from "../deploymentDiagram/DeploymentDiagramEditor";
import { SequenceDiagramEditor } from "../sequenceDiagram/SequenceDiagramEditor";
import { HtmlDrop } from "./HtmlDrop";
import { useRecoilBridgeAcrossReactRoots_UNSTABLE } from "recoil";
import { AppLayoutContext } from "../../app/appModel";
import { DiagramId } from "../diagramEditor/diagramEditorModel";
import { elementSelectedAction, useDispatch } from "../diagramEditor/diagramEditorSlice";

interface DiagramStageProps {
    activeDiagramId: DiagramId;
    stageRef: React.RefObject<Konva.Stage>;
    scrollContainerRef: React.RefObject<HTMLDivElement>;
    containerRef: React.RefObject<HTMLDivElement>;
    scale: number;
    position: { x: number, y: number };
    width: number;
    height: number;
    padding: number;
}

export const DiagramStage: React.FC<DiagramStageProps> = ({
    activeDiagramId,
    stageRef,
    scrollContainerRef,
    containerRef,
    scale,
    position,
    width,
    height,
    padding
}) => {
    const diagramKind = useRecoilValue(diagramKindSelector(activeDiagramId));
    const dispatch = useDispatch();
    const Bridge = useRecoilBridgeAcrossReactRoots_UNSTABLE();

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

    return (
        <div
            style={{
                width: width + 'px',
                height: height + 'px',
                overflow: 'hidden',
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
    );
};