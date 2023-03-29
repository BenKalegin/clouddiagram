import {Circle} from "react-konva";
import React from "react";
import {useRecoilValue} from "recoil";
import {NodeId, PortId, portRenderSelector, portSelector} from "./classDiagramModel";
import {DiagramId, linkingAtom} from "../diagramEditor/diagramEditorModel";

export interface PortProps {
    portId: PortId
    nodeId: NodeId
    diagramId: DiagramId
}
export const Port = ({diagramId, nodeId, portId}: PortProps) => {
    const port = useRecoilValue(portSelector(portId))
    const render = useRecoilValue(portRenderSelector({portId, nodeId, diagramId}))
    const linking = useRecoilValue(linkingAtom)
    const linkingTarget = linking?.targetElement;
    const linkingSource = linking?.sourceElement;

    return (
        <Circle
            x={render.bounds.x + render.bounds.width / 2}
            y={render.bounds.y + render.bounds.height / 2}
            radius={port.latitude / 2}
            stroke={"burlywood"}
            fill={portId === linkingTarget?.id || portId === linkingSource ? "burlywood": "cornsilk"}
        />
    )
}
