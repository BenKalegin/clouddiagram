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
    bounds: Bounds;
    direction: ResizeHandleDirection;
    onDrag: (bounds: Bounds) => void;
}

const calculateResizedBounds = (delta: Coordinate, direction: ResizeHandleDirection): Bounds => {
    switch (direction) {
        case ResizeHandleDirection.North:
            return {x: 0, y: delta.y, width: 0, height: -delta.y};
        case ResizeHandleDirection.NorthEast:
            return {x: 0, y: delta.y, width: delta.x, height: -delta.y};
        case ResizeHandleDirection.NorthWest:
            return {x: delta.x, y: delta.y, width: -delta.x, height: -delta.y};
        case ResizeHandleDirection.South:
            return {x: 0, y: 0, width: 0, height: delta.y};
        case ResizeHandleDirection.SouthEast:
            return {x: 0, y: 0, width: delta.x, height: delta.y};
        case ResizeHandleDirection.SouthWest:
            return {x: delta.x, y: 0, width: -delta.x, height: delta.y};
        case ResizeHandleDirection.East:
            return {x: 0, y: 0, width: delta.x, height: 0};
        case ResizeHandleDirection.West:
            return {x: delta.x, y: 0, width: -delta.x, height: 0};
    }

};

export const ResizeHandle = (props: ResizeHandleProps) => {

    const [position, setPosition] = React.useState<Coordinate>({x: props.bounds.x, y: props.bounds.y});

    return (
        <Rect
            x={props.bounds.x}
            y={props.bounds.y}
            width={props.bounds.width}
            height={props.bounds.height}
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

            onDragMove={e => {
                const delta: Coordinate = {
                    x: e.target.x() - position.x,
                    y: e.target.y() - position.y
                }
                setPosition({x: e.target.x(), y: e.target.y()});
                props.onDrag(calculateResizedBounds(delta, props.direction));
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

export const ResizeHandles = (props: { bounds: Bounds, onResize: (bounds: Bounds) => void }) => {
    return (
        <>
            {enumKeys(ResizeHandleDirection).map((direction, index) =>
                <ResizeHandle
                    key={index}
                    bounds={resizeHandleBounds(ResizeHandleDirection[direction], props.bounds)}
                    cursor={resizeHandleCursor(ResizeHandleDirection[direction])}
                    direction={ResizeHandleDirection[direction]}
                    onDrag={newBounds => props.onResize(newBounds)}
                />
            )}
        </>
    )
}
