import {Circle} from "react-konva";
import React, {useState} from "react";
import {PortState} from "./model";


export interface PortProps {
    port: PortState;
}


export const Port = function (props: PortProps) {

    const [isHover, setIsHover] = useState(false);

    const bounds = props.port.placement;
    return (
        <Circle
            x={bounds.x + bounds.width / 2}
            y={bounds.y + bounds.height / 2}
            radius={props.port.latitude / 2}
            stroke={"burlywood"}
            fill={isHover ? "burlywood": "cornsilk"}
            onMouseEnter={() => {setIsHover(true)}}
            onMouseLeave={() => {setIsHover(false)}}
        />
    )
}
