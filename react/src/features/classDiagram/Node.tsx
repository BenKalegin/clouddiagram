import React, {FC} from "react";
import {Rect, Text} from "react-konva";
import {Port} from "./Port";
import {Scaffold} from "../scaffold/Scaffold";
import {DrawingLink} from "./DrawingLink";
import {classDiagramSelector, NodeId, NodePlacement} from "./model";
import {DefaultValue, selectorFamily, useRecoilState, useRecoilValue} from "recoil";
import {DiagramId, elementsAtom, linkingAtom, selectedElementsAtom} from "../diagramEditor/diagramEditorModel";
import {NodeState} from "../../package/packageModel";
import {Bounds} from "../../common/model";

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
    const [placement, setPlacement] = useRecoilState(nodePlacement({nodeId, diagramId}))
    const [selectedElements, setSelectedElements] = useRecoilState(selectedElementsAtom)
    const linking = useRecoilValue(linkingAtom)

    const isSelected = selectedElements.includes(nodeId);
    const isFocused = selectedElements.length > 0 && selectedElements.at(-1) === nodeId;

    function updatePlacement(newBounds: Bounds) {
        setPlacement({...placement, bounds: newBounds})
    }

    return (
        <React.Fragment>
            <Rect
                fill={"cornsilk"}
                stroke={"burlywood"}
                {...placement.bounds}
                cornerRadius={10}
                cursor={"crosshair"}
                //draggable
                onClick={() => setSelectedElements([nodeId])
                }
                //onDragEnd={(e) => updatePlacement(e)}
            />
            {isSelected && (
                <Scaffold
                    elementId={nodeId}
                    bounds={placement.bounds}
                    isFocused={isFocused}
                    isLinking={linking.drawing}
                    onResize={e => updatePlacement(e)}
                    linkingDrawing={<DrawingLink nodePlacement={placement.bounds}/>}
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
                />
            )}

        </React.Fragment>
    );
}
