import React from "react";
import {Path} from "react-konva";
import {LinkState} from "./classDiagramSlice";

export const Link = function (link: LinkState)
{
    //const svgData = "M 154 107 C 269 107, 166 340, 281 340";
    return (
        <React.Fragment>
            {link.placement.svgPath.map((pathData, index) =>
                <Path
                    key={index}
                    data={pathData}
                    fill={undefined}
                    strokeWidth={1.4}
                    stroke={"brown"}
                />
            )}
            </React.Fragment>
    );
}
