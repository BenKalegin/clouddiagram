import React from "react";
import {LinkState} from "./Models";
import {Path} from "react-konva";
import {PathGenerators} from "../Common/Geometry/PathGenerator";

export const Link = function (link: LinkState)
{
    //const svgData = PathGenerators.GetRouteWithCurvePoints(link, [link.port1, link.port2]);
    const svgData = "M 154 107 C 269 107, 166 340, 281 340";
    return (
        <React.Fragment>
            <Path
                data={svgData}
                fill={undefined}
                strokeWidth={1.4}
                stroke={"brown"}
            />
            </React.Fragment>
    );
}
