import {Bounds, Coordinate} from "../../common/Model";
import React from "react";
import {Rect} from "react-konva";
import {enumKeys} from "../../common/EnumUtils";

export enum ResizeHandleDirection {
    North = 'n',
    NorthEast = 'ne',
    NorthWest = 'nw',
    South = 's',
    SouthEast = 'se',
    SouthWest = 'sw',
    East = 'e',
    West = 'w'
}


export interface ResizeHandleProps {
    cursor: string;
    handlerBounds: Bounds;
    direction: ResizeHandleDirection;
    nodeBounds: Bounds;
    onDrag: (bounds: Bounds) => void;
}

const calculateResizedBounds = (delta: Coordinate, original: Bounds, direction: ResizeHandleDirection): Bounds => {
    switch (direction) {
        case ResizeHandleDirection.North:
            return {x: original.x + delta.x, y: original.y + delta.y, width: original.width, height: original.height - delta.y};
        case ResizeHandleDirection.NorthEast:
            return {x: original.x, y: original.y + delta.y, width: original.width + delta.x, height: original.height - delta.y};
        case ResizeHandleDirection.NorthWest:
            return {x: original.x + delta.x, y: original.y + delta.y, width: original.width - delta.x, height: original.height - delta.y};
        case ResizeHandleDirection.South:
            return {x: original.x, y: original.y, width: original.width, height: original.height + delta.y};
        case ResizeHandleDirection.SouthEast:
            return {x: original.x, y: original.y, width: original.width + delta.x, height: original.height + delta.y};
        case ResizeHandleDirection.SouthWest:
            return {x: original.x + delta.x, y: original.y, width: original.width - delta.x, height: original.height + delta.y};
        case ResizeHandleDirection.East:
            return {x: original.x, y: original.y, width: original.width + delta.x, height: original.height};
        case ResizeHandleDirection.West:
            return {x: original.x + delta.x, y: original.y, width: original.width-delta.x, height: original.height };
    }

};

export const ResizeHandle = (props: ResizeHandleProps) => {
    const [mouseStart, setMouseStart] = React.useState<Coordinate | undefined>(undefined);

    return (
        <Rect
            x={props.handlerBounds.x}
            y={props.handlerBounds.y}
            width={props.handlerBounds.width}
            height={props.handlerBounds.height}
            stroke={"gray"}
            fill={"white"}
            strokeWidth={1}
            name={"rh" + props.direction}
            dragDistance={0}
            cursor={props.cursor}
            // make it draggable,
            // so activating the anchor will not start drag&drop of any parent
            draggable={true}
            // hitStrokeWidth = {TOUCH_DEVICE ? 10 : 'auto'},
            onMouseEnter={e => {
                const container = e.target.getStage()?.container();
                if (container)
                    container.style.cursor = props.cursor;
            }}
            onMouseLeave={e => {
                const container = e.target.getStage()?.container();
                if (container)
                    container.style.cursor = "default";
            }}

            onDragStart={(e) => {
                setMouseStart({x: e.target.x(), y: e.target.y()})
            }}

            onDragMove={e => {
                if (mouseStart) {
                    const newCoordinate: Coordinate = {
                        x: e.target.x() - mouseStart.x,
                        y: e.target.y() - mouseStart.y
                    }
                    props.onDrag(calculateResizedBounds(newCoordinate, props.nodeBounds, props.direction));
                }
            }}
        />
    );
}

const resizeHandleBounds = (direction: ResizeHandleDirection, bounds: Bounds): Bounds => {
    const width = 7;
    const height = 7;

    switch (direction) {
        case ResizeHandleDirection.North:
            return {x: bounds.x + (bounds.width - width) / 2, y: bounds.y, width: width, height: height};
        case ResizeHandleDirection.NorthEast:
            return {x: bounds.x + bounds.width - width / 2, y: bounds.y, width: width, height: height};
        case ResizeHandleDirection.NorthWest:
            return {x: bounds.x, y: bounds.y, width: width, height: height};
        case ResizeHandleDirection.South:
            return {
                x: bounds.x + (bounds.width - width) / 2,
                y: bounds.y + bounds.height - height / 2,
                width: width,
                height: height
            };
        case ResizeHandleDirection.SouthEast:
            return {
                x: bounds.x + bounds.width - width / 2,
                y: bounds.y + bounds.height - height / 2,
                width: width,
                height: height
            };
        case ResizeHandleDirection.SouthWest:
            return {x: bounds.x, y: bounds.y + bounds.height - height / 2, width: width, height: height};
        case ResizeHandleDirection.East:
            return {
                x: bounds.x + bounds.width - width / 2,
                y: bounds.y + (bounds.height - height) / 2,
                width: width,
                height: height
            };
        case ResizeHandleDirection.West:
            return {x: bounds.x, y: bounds.y + (bounds.height - height) / 2, width: width, height: height};
    }
}

const resizeHandleCursor = (direction: ResizeHandleDirection): string => {
    switch (direction) {
        case ResizeHandleDirection.North:
            return "ns-resize";
        case ResizeHandleDirection.NorthEast:
            // noinspection SpellCheckingInspection
            return "nesw-resize";
        case ResizeHandleDirection.NorthWest:
            // noinspection SpellCheckingInspection
            return "nwse-resize";
        case ResizeHandleDirection.South:
            return "ns-resize";
        case ResizeHandleDirection.SouthEast:
            // noinspection SpellCheckingInspection
            return "nwse-resize";
        case ResizeHandleDirection.SouthWest:
            // noinspection SpellCheckingInspection
            return "nesw-resize";
        case ResizeHandleDirection.East:
            return "ew-resize";
        case ResizeHandleDirection.West:
            return "ew-resize";
    }
}

export const ResizeHandles = (props: { perimeterBounds: Bounds, nodeBounds: Bounds, onResize: (bounds: Bounds) => void }) => {

    const [nodeStart] = React.useState<Bounds>(props.nodeBounds);
    return (
        <>
            {enumKeys(ResizeHandleDirection).map((direction, index) =>
                <ResizeHandle
                    key={index}
                    handlerBounds={resizeHandleBounds(ResizeHandleDirection[direction], props.perimeterBounds)}
                    nodeBounds={nodeStart}
                    cursor={resizeHandleCursor(ResizeHandleDirection[direction])}
                    direction={ResizeHandleDirection[direction]}
                    onDrag={newBounds => props.onResize(newBounds)}
                />
            )}
        </>
    )
}
