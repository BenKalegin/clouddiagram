import React, {FC} from "react";
import {Rect, Text} from "react-konva";
import {Port} from "../classDiagram/Port";
import {Scaffold} from "../scaffold/Scaffold";
import {DrawingLink} from "../classDiagram/DrawingLink";
import {classDiagramSelector, NodeId, NodePlacement} from "../classDiagram/classDiagramModel";
import {DefaultValue, selectorFamily, useRecoilValue} from "recoil";
import {
    DiagramId,
    elementsAtom,
    linkingAtom,
    selectedRefsSelector
} from "../diagramEditor/diagramEditorModel";
import {ElementType, NodeState} from "../../package/packageModel";
import {useCustomDispatch} from "../diagramEditor/commonHandlers";

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
    const element = {id: nodeId, type: ElementType.ClassNode};

    const eventHandlers = useCustomDispatch({
        onClick: true,
        onDrag: true,
        element: element,
        diagramId: diagramId,
        bounds: placement.bounds,
    });

    return (
        <React.Fragment>
            <Rect
                {...eventHandlers}
                fill={node.shapeStyle.fillColor}
                stroke={node.shapeStyle.strokeColor}
                {...placement.bounds}
                cornerRadius={10}
                cursor={"crosshair"}
                //draggable
                draggable={true}
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
