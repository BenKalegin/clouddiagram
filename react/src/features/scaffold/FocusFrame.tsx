import {Bounds} from "../../common/Model";
import {Rect} from "react-konva";
import React from "react";

export interface FocusFrameProps {
    bounds: Bounds;
}

export const FocusFrame = (props: FocusFrameProps) => {
    return (
        <Rect
            x={props.bounds.x}
            y={props.bounds.y}
            width={props.bounds.width}
            height={props.bounds.height}
            fill={"transparent"}
            dash={[3, 5]}
            stroke={"darkgray"}
            strokeWidth={4}
            draggable={false}
            listening={false}
            cornerRadius={0}>
        </Rect>
    );
};

