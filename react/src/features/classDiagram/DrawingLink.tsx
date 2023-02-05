import {Path} from "react-konva";
import React from "react";
import {Bounds} from "../../common/model";
import {ElementType, PortAlignment, PortState} from "../../package/packageModel";
import {useRecoilValue} from "recoil";
import {linkingAtom} from "../diagramEditor/diagramEditorModel";
import {renderLink} from "./model";

export const DrawingLink = (props: { nodePlacement: Bounds }) => {

    const linking = useRecoilValue(linkingAtom)

/*
    const sourcePort: PortState = {
        type: ElementType.ClassPort,
        id: "DrawingLinkSourcePort",
        depthRatio: 50,
        latitude: 0,
        longitude: 0
    }
*/
    // alignment: PortAlignment.Right,
    // edgePosRatio: 50,

    //sourcePort.placement = portBounds(props.nodePlacement, sourcePort)
/*
    const targetPort: PortState = {
        type: ElementType.ClassPort,
        id: "DrawingLinkTarget",
        depthRatio: 50,
        latitude: 0,
        longitude: 0,
    }
*/
    // alignment: PortAlignment.Left,
    // edgePosRatio: 50,

    //targetPort.placement = {...linking.diagramPos, width: 0, height: 0}

    // const placement = renderLink(sourcePort, targetPort);
    return (
        <>
            {/*{placement.svgPath.map((pathData, index) =>*/}
            {/*    <Path*/}
            {/*        key={index}*/}
            {/*        data={pathData}*/}
            {/*        fill={undefined}*/}
            {/*        strokeWidth={1.4}*/}
            {/*        stroke={"brown"}*/}
            {/*    />*/}
            {/*)}*/}
        </>
    );

};
