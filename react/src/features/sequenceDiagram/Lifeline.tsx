import {Group, Rect, Text} from "react-konva";
import {LifelineState} from "./model";
import React from "react";

export interface LifelineProps {
    isSelected: boolean;
    isFocused: boolean;
    lifeline: LifelineState;
}


export const Lifeline = (props: LifelineProps) => {
    return (
        <Group>
            <Rect
                fill={"cornsilk"}
                stroke={"burlywood"}
                {...props.lifeline.placement.headBounds}
                x={props.lifeline.placement.headBounds.x}
            >
            </Rect>
            <Text
                {...props.lifeline.placement.headBounds}
                fontSize={14}
                align={"center"}
                verticalAlign={"middle"}
                text={props.lifeline.title}
                draggable={false}
                listening={false}
                preventDefault={true}
            />
        </Group>
    )
}
