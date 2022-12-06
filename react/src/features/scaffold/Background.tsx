import {Bounds, Coordinate} from "../../common/Model";
import React from "react";
import {useAppDispatch} from "../../app/hooks";
import {Rect} from "react-konva";
import {nodeShowProperties} from "../classDiagram/diagramEditorSlice";

export interface BackgroundProps {
    bounds: Bounds;
    onDrag: (bounds: Bounds) => void;
}

export const Background = (props: BackgroundProps) => {
    const [position, setPosition] = React.useState<Coordinate>({x: props.bounds.x, y: props.bounds.y});
    const dispatch = useAppDispatch()

    return (
        <Rect
            x={props.bounds.x}
            y={props.bounds.y}
            width={props.bounds.width}
            height={props.bounds.height}
            fill={"transparent"}
            stroke={""}
            strokeWidth={0}
            draggable={true}
            onDragMove={e => {
                const delta: Coordinate = {
                    x: e.target.x() - position.x,
                    y: e.target.y() - position.y
                }
                setPosition({x: e.target.x(), y: e.target.y()});
                props.onDrag({
                    x: delta.x, y: delta.y, width: 0, height: 0
                });
            }}
            onDblClick={() => dispatch(nodeShowProperties())}
        />
    );
};

