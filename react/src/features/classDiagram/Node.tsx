import React, {FC} from "react";
import {Rect, Text} from "react-konva";
import {Port} from "./Port";
import {Scaffold} from "../scaffold/Scaffold";
import {DrawingLink} from "./DrawingLink";
import {classDiagramSelector, NodeId, NodePlacement} from "./classDiagramModel";
import {DefaultValue, selectorFamily, useRecoilValue} from "recoil";
import {
    DiagramId,
    elementsAtom,
    linkingAtom,
    selectedRefsSelector
} from "../diagramEditor/diagramEditorModel";
import {ElementType, ElementRef, NodeState} from "../../package/packageModel";
import {Coordinate} from "../../common/model";
import {
    elementMoveAction,
    ElementMoveResizePhase, elementSelectedAction,
    screenToCanvas,
    useDispatch
} from "../diagramEditor/diagramEditorSlice";

export interface NodeProps {
    nodeId: NodeId
    diagramId: DiagramId
}

export const nodePlacement = selectorFamily<NodePlacement, {nodeId: NodeId, diagramId: DiagramId}>({
    key: 'placements',
    get: ({nodeId, diagramId}) => ({get}) => {
        const diagram = get(classDiagramSelector(diagramId))
        return diagram.nodes[nodeId]
    },
    set: ({nodeId, diagramId}) => ({set, get}, newValue) => {
        const diagram = get(classDiagramSelector(diagramId))
        if (!(newValue instanceof DefaultValue)) {
            set(classDiagramSelector(diagramId), {...diagram, nodes: {...diagram.nodes, [nodeId]: newValue}})
        }
    }
})

export const Node: FC<NodeProps> = ({nodeId, diagramId}) => {
    const node = useRecoilValue(elementsAtom(nodeId)) as NodeState
    const placement = useRecoilValue(nodePlacement({nodeId, diagramId}))

    const selectedElements = useRecoilValue(selectedRefsSelector(diagramId))
    const isSelected = selectedElements.map(e => e.id).includes(nodeId);
    const isFocused = selectedElements.length > 0 && selectedElements.at(-1)?.id === nodeId;

    const linking = useRecoilValue(linkingAtom)
    const linkingTarget = linking?.targetElement;
    const linkingSource = linking?.sourceElement;
    const [startNodePos, setStartNodePos] = React.useState<Coordinate | undefined>();
    const [startPointerPos, setStartPointerPos] = React.useState<Coordinate | undefined>();
    const dispatch = useDispatch()
    const element = {id: nodeId, type: ElementType.ClassNode};


    return (
        <React.Fragment>
            <Rect
                fill={node.shapeStyle.fillColor}
                stroke={node.shapeStyle.strokeColor}
                {...placement.bounds}
                cornerRadius={10}
                cursor={"crosshair"}
                //draggable
                onClick={(e) => {
                    dispatch(elementSelectedAction({element, shiftKey: e.evt.shiftKey, ctrlKey: e.evt.ctrlKey}))
                }}
                draggable={true}
                onDragStart={(e) => {
                    const pos = screenToCanvas(e);
                    setStartNodePos(placement.bounds);
                    setStartPointerPos(pos);
                    const element: ElementRef = {id: nodeId, type: ElementType.ClassNode}
                    if (!isSelected)
                        dispatch(elementSelectedAction({element, shiftKey: e.evt.shiftKey, ctrlKey: e.evt.ctrlKey}))

                    dispatch(elementMoveAction({
                        phase: ElementMoveResizePhase.start,
                        element,
                        startNodePos: {x: placement.bounds.x, y: placement.bounds.y},
                        startPointerPos: pos,
                        currentPointerPos: pos}))
                }}
                onDragMove={(e) => {
                    if (startPointerPos && startNodePos)
                        dispatch(elementMoveAction({
                            phase: ElementMoveResizePhase.move,
                            element,
                            startNodePos: startNodePos,
                            startPointerPos: startPointerPos,
                            currentPointerPos: screenToCanvas(e)}));
                }}

                onDragEnd={(e) => {
                    // check required because DragMove event can be received before DragStart updated the state
                    if (startPointerPos && startNodePos)
                        dispatch(elementMoveAction({
                            phase: ElementMoveResizePhase.end,
                            element,
                            startNodePos: startNodePos,
                            startPointerPos: startPointerPos,
                            currentPointerPos: screenToCanvas(e)}));
                }
                }
                shadowEnabled={nodeId === linkingTarget?.id || nodeId === linkingSource}
                shadowColor={'black'}
                shadowBlur={3}
                shadowOffset={{x: 2, y: 2}}
                shadowOpacity={0.4}


            />
            {isSelected && (
                <Scaffold
                    element={{id: nodeId, type: ElementType.ClassNode}}
                    bounds={placement.bounds}
                    isFocused={isFocused}
                    isLinking={linking?.drawing === true}
                    linkingDrawing={<DrawingLink/>}
                />
            )}
            <Text
                {...placement.bounds}
                fontSize={14}
                align={"center"}
                verticalAlign={"middle"}
                text={node.text}
                draggable={false}
                listening={false}
                preventDefault={true}
            />
            {node.ports.map((port, index) =>
                <Port
                    key={index}
                    portId={port}
                    nodeId={nodeId}
                    diagramId={diagramId}
                    shapeStyle={node.shapeStyle}
                />
            )}

        </React.Fragment>
    );
}
