import {Bounds, Coordinate, zeroCoordinate} from "../../common/model";
import React from "react";
import {Rect} from "react-konva";
import Konva from "konva";
import KonvaEventObject = Konva.KonvaEventObject;

export interface BackgroundProps {
    backgroundBounds: Bounds;
    nodeBounds: Bounds;
    startNodeMove: (pos: Coordinate) => void
    continueNodeMove: (pos: Coordinate) => void
    endNodeMove: (pos: Coordinate) => void
    doubleClick: () => void
}

export const Background = (props: BackgroundProps) => {

    function screenToCanvas(e: KonvaEventObject<DragEvent>) {
        const stage = e.target.getStage()?.getPointerPosition() ?? zeroCoordinate;
        return {x: e.evt.x - stage.x, y: e.evt.y - stage.y};
    }

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
            onDragStart={(e) => props.startNodeMove(screenToCanvas(e))}
            onDragMove={(e) => props.continueNodeMove(screenToCanvas(e))}
            onDragEnd={(e) => props.endNodeMove(screenToCanvas(e))}
            onDblClick={() => props.doubleClick()}
        />
    );
};

