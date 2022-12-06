import {Bounds, Coordinate} from "../../common/Model";
import React, {useState} from "react";
import {Group, Path} from "react-konva";

interface ContextButtonProps {
    svgPath: string
    placement: Bounds
}

export const ContextButton = (props: ContextButtonProps) => {
    const [isHover, setIsHover] = useState(false);
    const scaleX = 1;
    return (
        <Group {...props.placement} >
            <Path
                width={props.placement.width - 2}
                height={props.placement.height - 2}
                data={props.svgPath}
                fill={isHover ? "black" : "darkgray"}
                stroke="transparent"
                strokeWidth={1 / scaleX}
                onMouseEnter={() => {setIsHover(true)}}
                onMouseLeave={() => {setIsHover(false)}}
            />
        </Group>
    )
}

interface ContextButtonsProps {
    placement: Coordinate
}

export const ContextButtons = (props: ContextButtonsProps) => {
    const {y, x} = props.placement;
    return (
        <ContextButton svgPath={"m12 4-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"}
                       placement={{x: x, y: y, width: 16, height: 16}}
        />
    )
}

