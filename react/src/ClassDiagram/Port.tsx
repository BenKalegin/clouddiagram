import {Circle} from "react-konva";
import React, {useState} from "react";
import {Bounds, Coordinate, PortState, PortPosition} from "./Models";


export interface PortProps {
    port: PortState;
    node: Bounds;
}


export const Port = function (props: PortProps) {

    const [isHover, setIsHover] = useState(false);

    const portPos = (): Coordinate => {
        const node: Bounds = props.node;
        const port: PortState = props.port;
        switch (port.position) {
            case PortPosition.Top:
                return {
                    x: node.x + node.width / 2,
                    y: node.y
                }
            case PortPosition.Bottom:
                return {
                    x: node.x + node.width / 2,
                    y: node.y + node.height
                }
            case PortPosition.Left:
                return {
                    x: node.x,
                    y: node.y + node.height / 2
                }
            case PortPosition.Right:
                return {
                    x: node.x + node.width,
                    y: node.y + node.height / 2
                };
        }
    };


    return (
        <Circle
            {...portPos()}
            radius={6}
            stroke={"burlywood"}
            fill={isHover ? "burlywood": "cornsilk"}
            onMouseEnter={() => {setIsHover(true)}}
            onMouseLeave={() => {setIsHover(false)}}
        />
    )
}
