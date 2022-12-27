import {Path} from "react-konva";
import React from "react";
import {linkPlacement, PortAlignment, portBounds, PortState} from "./model";
import {Bounds, zeroBounds} from "../../common/Model";
import {useAppSelector} from "../../app/hooks";
import {selectClassDiagramEditor} from "./diagramEditorSlice";

export const DrawingLink = (props: { nodePlacement: Bounds }) => {

    const mousePos = useAppSelector(state => selectClassDiagramEditor(state).linking?.mousePos);
    const mouseStartPos = useAppSelector(state => selectClassDiagramEditor(state).linking?.mouseStartPos);

    const sourcePort: PortState = {
        id: "DrawingLinkSourcePort",
        alignment: PortAlignment.Right,
        depthRatio: 50,
        edgePosRatio: 50,
        latitude: 0,
        longitude: 0,
        placement: zeroBounds
    }
    sourcePort.placement = portBounds(props.nodePlacement, sourcePort)
    const targetPort: PortState = {
        id: "DrawingLinkTarget",
        alignment: PortAlignment.Left,
        depthRatio: 50,
        edgePosRatio: 50,
        latitude: 0,
        longitude: 0,
        placement: zeroBounds
    }
    targetPort.placement = {
        x: sourcePort.placement.x +  mousePos!.x - mouseStartPos!.x,
        y: sourcePort.placement.y +  mousePos!.y - mouseStartPos!.y, width: 0, height: 0}

    const placement = linkPlacement(sourcePort, targetPort);
    return (
        <>
            {placement.svgPath.map((pathData, index) =>
                <Path
                    key={index}
                    data={pathData}
                    fill={undefined}
                    strokeWidth={1.4}
                    stroke={"brown"}
                />
            )}
        </>
    );

};
