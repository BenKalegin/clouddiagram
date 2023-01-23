import {Bounds, Coordinate, Id, zeroCoordinate} from "../../common/model";
import React from "react";
import {useAppDispatch, useAppSelector} from "../../app/hooks";
import {Rect} from "react-konva";
import {nodeShowProperties, selectClassDiagramEditor} from "../classDiagram/classDiagramSlice";
import {snapToGrid} from "../../common/Geometry/snap";
import {continueNodeResize, endNodeResize, startLinking, startNodeResize} from "../diagramEditor/diagramEditorSlice";

export interface BackgroundProps {
    backgroundBounds: Bounds;
    nodeBounds: Bounds;
    element: Id
}

export const Background = (props: BackgroundProps) => {
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
                dispatch(startNodeResize({
                    elementId: props.element,
                    mousePos: {x: e.evt.x, y: e.evt.y},
                    relativePos: {x: props.nodeBounds.x, y: props.nodeBounds.y }
                }))
            }}

            onDragMove={(e) => {
                dispatch(continueNodeResize({
                    elementId: props.element,
                    mousePos: {x: e.evt.x, y: e.evt.y},
                    relativePos: {x: props.nodeBounds.x, y: props.nodeBounds.y }
                }))
            }}

            onDragEnd={(e) => {
                dispatch(endNodeResize({
                    elementId: props.element,
                    mousePos: {x: e.evt.x, y: e.evt.y},
                    relativePos: {x: props.nodeBounds.x, y: props.nodeBounds.y }
                }))
            }}

            onDblClick={() => dispatch(nodeShowProperties())}
        />
    );
};

