import {Circle} from "react-konva";
import React, {useState} from "react";
import {Bounds} from "./Models";
import {PortState} from "./classDiagramSlice";


export interface PortProps {
    port: PortState;
    bounds: Bounds;
}


export const Port = function (props: PortProps) {

    const [isHover, setIsHover] = useState(false);

    return (
        <Circle
            x={props.bounds.x + props.bounds.width / 2}
            y={props.bounds.y + props.bounds.height / 2}
            radius={props.port.latitude / 2}
            stroke={"burlywood"}
            fill={isHover ? "burlywood": "cornsilk"}
            onMouseEnter={() => {setIsHover(true)}}
            onMouseLeave={() => {setIsHover(false)}}
        />
    )
}
