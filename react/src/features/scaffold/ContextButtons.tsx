import {Bounds, Coordinate, Id} from "../../common/model";
import React, {RefObject, useState} from "react";
import {Group, Path, Rect} from "react-konva";
import {useAppDispatch} from "../../app/hooks";
import {startLinking} from "../classDiagram/classDiagramSlice";
import Konva from "konva";
import KonvaEventObject = Konva.KonvaEventObject;

interface ContextButtonProps {
    svgPath: string
    placement: Bounds
    draggable?: boolean
    onMouseDown?: (mousePos: Coordinate, relativePos: Coordinate) => void
}

export const ContextButton = (props: ContextButtonProps) => {
    const [isHover, setIsHover] = useState(false);
    const scaleX = 1;
    const groupRef: RefObject<Konva.Group> = React.useRef(null);

    return (
        <Group {...props.placement}
            ref={groupRef}
            onMouseEnter={() => {setIsHover(true)}}
            onMouseLeave={() => {setIsHover(false)}}
            onMouseDown={(e: KonvaEventObject<MouseEvent>) => {
               e.cancelBubble = true;

               if(props.onMouseDown != null) {
                   const pos = groupRef.current?.getStage()!.getRelativePointerPosition()!
                   props.onMouseDown({x: e.evt.x, y: e.evt.y}, pos)
               }
           }}
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
            onMouseDown={(mousePos, relativePos) => {
                dispatch(startLinking(
                {
                    elementId: props.elementId,
                    mousePos: mousePos,
                    relativePos: relativePos
                }
                ))}}
        />
    )
}

