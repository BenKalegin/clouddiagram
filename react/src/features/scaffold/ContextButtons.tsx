import {Bounds, Coordinate, Id} from "../../common/Model";
import React, {useEffect, useState} from "react";
import {Group, Path, Rect} from "react-konva";
import {useAppDispatch} from "../../app/hooks";
import {startLinking} from "../classDiagram/diagramEditorSlice";

interface ContextButtonProps {
    svgPath: string
    placement: Bounds
    onClick: () => void
}

export const ContextButton = (props: ContextButtonProps) => {
    const [isHover, setIsHover] = useState(false);
    const scaleX = 1;
    return (
        <Group {...props.placement}
               onMouseEnter={() => {setIsHover(true)}}
               onMouseLeave={() => {setIsHover(false)}}
               onClick={() => {props.onClick()}}
        >
            <Rect
              width={props.placement.width - 2}
              height={props.placement.height - 2}
              fill={"transparent"}
              strokeWeight={0}
            />
            <Path
                width={props.placement.width - 2}
                height={props.placement.height - 2}
                data={props.svgPath}
                fill={isHover ? "black" : "darkgray"}
                stroke="transparent"
                strokeWidth={1 / scaleX}
            />
        </Group>
    )
}

interface ContextButtonsProps {
    placement: Coordinate
    elementId: Id
}

export const ContextButtons = (props: ContextButtonsProps) => {
    const dispatch = useAppDispatch()
    const {y, x} = props.placement;
    return (
        <ContextButton
            svgPath={"m12 4-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"}
            placement={{x: x, y: y, width: 16, height: 16}}
            onClick={() => {dispatch(startLinking(props.elementId))}}
        />
    )
}

