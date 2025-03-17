import {Circle} from "react-konva";
import React from "react";
import {useRecoilValue} from "recoil";
import {DiagramId, linkingAtom} from "../diagramEditor/diagramEditorModel";
import {ColorSchema} from "../../package/packageModel";
import {portRenderSelector} from "./structureDiagramEditor";
import {NodeId, PortId} from "./structureDiagramState";
import {portSelector} from "./structureDiagramModel";

export interface PortProps {
    portId: PortId
    nodeId: NodeId
    diagramId: DiagramId
    colorSchema: ColorSchema
}
export const Port = ({diagramId, nodeId, portId, colorSchema}: PortProps) => {
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
            stroke={colorSchema.strokeColor}
            fill={portId === linkingTarget?.id || portId === linkingSource ? colorSchema.strokeColor: colorSchema.fillColor}
        />
    )
}
