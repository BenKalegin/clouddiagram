import {Bounds, Coordinate, zeroCoordinate} from "../../common/model";
import React from "react";
import {useAppDispatch, useAppSelector} from "../../app/hooks";
import {Rect} from "react-konva";
import {nodeShowProperties, selectClassDiagramEditor} from "../classDiagram/classDiagramSlice";
import {snapToGrid} from "../../common/Geometry/snap";

export interface BackgroundProps {
    backgroundBounds: Bounds;
    nodeBounds: Bounds;
    onDrag: (bounds: Bounds) => void;
}

export const Background = (props: BackgroundProps) => {
    const [mouseStart, setMouseStart] = React.useState<Coordinate>(zeroCoordinate);
    const [nodeStart] = React.useState<Bounds>(props.nodeBounds);
    const dispatch = useAppDispatch()
    const snapGridSize = useAppSelector(state => selectClassDiagramEditor(state).snapGridSize)

    return (
        <Rect
            x={props.backgroundBounds.x}
            y={props.backgroundBounds.y}
            width={props.backgroundBounds.width}
            height={props.backgroundBounds.height}
            fill={"transparent"}
            stroke={""}
            strokeWidth={0}
            draggable={true}
            onDragStart={(e) => {
                setMouseStart({x: e.target.x(), y: e.target.y()})
            }}
            onDragMove={e => {
                props.onDrag({
                    ...snapToGrid({
                        x: e.target.x() - mouseStart.x + nodeStart.x,
                        y: e.target.y() - mouseStart.y + nodeStart.y,
                    }, snapGridSize),
                    width: nodeStart.width,
                    height: nodeStart.height
                });
            }}
            onDblClick={() => dispatch(nodeShowProperties())}
        />
    );
};

