import React from "react";
import {LinkState} from "./Models";
import {Path} from "react-konva";

export const Link = function (link: LinkState)
{
    return (
        <React.Fragment>
            <Path
                data={"M 154 107 C 269 107, 166 340, 281 340"}
                fill={undefined}
                strokeWidth={1.4}
                stroke={"brown"}
            />
            </React.Fragment>
    );
}
