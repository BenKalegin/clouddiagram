import {Path} from "react-konva";
import React from "react";
import {linkPlacement, PortAlignment, portBounds, PortState} from "./model";
import {Bounds, zeroBounds} from "../../common/Model";
import {useAppSelector} from "../../app/hooks";
import {selectClassDiagramEditor} from "./diagramEditorSlice";

export const DrawingLink = (props: { nodePlacement: Bounds }) => {

    const linking = useAppSelector(state => selectClassDiagramEditor(state).linking!);

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
        x: linking.mousePos!.x - linking.mouseStartPos!.x + linking.relativeStartPos!.x,
        y: linking.mousePos!.y - linking.mouseStartPos!.y + linking.relativeStartPos!.y
        , width: 0, height: 0}

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
