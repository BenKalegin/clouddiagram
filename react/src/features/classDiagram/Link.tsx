import React from "react";
import {Path} from "react-konva";
import {LinkState} from "./model";

export const Link = function (link: LinkState)
{
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
