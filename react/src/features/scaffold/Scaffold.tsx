import React, {useState} from "react";
import {Group, Path, Rect} from "react-konva";
import {Bounds, Coordinate, inflate} from "../../common/Model";
import {nodeShowProperties} from "../classDiagram/diagramEditorSlice";
import {useAppDispatch} from "../../app/hooks";
import {enumKeys} from "../../common/EnumUtils";

export interface ScaffoldProps {
    bounds: Bounds;
    resizeEnabled?: boolean;
    borderEnabled?: boolean;
    borderStroke?: string;
    borderStrokeWidth?: number;
    borderDash?: Array<number>;
    anchorFill?: string;
    anchorStroke?: string;
    anchorStrokeWidth?: number;
    anchorSize?: number;
    anchorCornerRadius?: number;
    keepRatio?: boolean;
    centeredScaling?: boolean;
    enabledAnchors?: Array<string>;
    flipEnabled?: boolean;
    ignoreStroke?: boolean;
    useSingleNodeRotation?: boolean;
    shouldOverdrawWholeArea?: boolean;
    isFocused?: boolean;
    onResize: (suggestedBounds: Bounds) => void;
}

enum ResizeHandleDirection {
    North = 'n',
    NorthEast = 'ne',
    NorthWest = 'nw',
    South = 's',
    SouthEast = 'se',
    SouthWest = 'sw',
    East = 'e',
    West = 'w'
}

//const TOUCH_DEVICE = 'ontouchstart' in Konva._global;


export interface FocusFrameProps {
    bounds: Bounds;
}

const FocusFrame = (props: FocusFrameProps) => {
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

export interface BackgroundProps {
    bounds: Bounds;
    onDrag: (bounds: Bounds) => void;
}

const Background = (props: BackgroundProps) => {
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

const ResizeHandle = (props: ResizeHandleProps) => {

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

interface ContextButtonProps {
    svgPath: string
    placement: Bounds
}

export const ContextButton = (props: ContextButtonProps) => {
    const [isHover, setIsHover] = useState(false);
    const scaleX = 1;
    return (
        <Group {...props.placement} >
        <Path
            width={props.placement.width - 2}
            height={props.placement.height - 2}
            data={props.svgPath}
            fill={isHover ? "black" : "darkgray"}
            stroke="transparent"
            strokeWidth={1 / scaleX}
            onMouseEnter={() => {setIsHover(true)}}
            onMouseLeave={() => {setIsHover(false)}}
        />
        </Group>
    )
}

interface ContextButtonsProps {
    placement: Coordinate
}

export const ContextButtons = (props: ContextButtonsProps) => {
    const {y, x} = props.placement;
    return (
        <ContextButton svgPath={"m12 4-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"}
                       placement={{x: x, y: y, width: 20, height: 20}}
        />
    )
}

export const Scaffold = (props: ScaffoldProps) => {
    const bounds = inflate(props.bounds, 12, 12);
    return (
        <React.Fragment>
            <Background
                bounds={bounds}
                onDrag={newBounds => props.onResize(newBounds)}
            />
            {enumKeys(ResizeHandleDirection).map((direction, index) =>
                <ResizeHandle
                    key={index}
                    bounds={resizeHandleBounds(ResizeHandleDirection[direction], bounds)}
                    cursor={resizeHandleCursor(ResizeHandleDirection[direction])}
                    direction={ResizeHandleDirection[direction]}
                    onDrag={newBounds => props.onResize(newBounds)}
                />
            )}
            {props.isFocused && <FocusFrame
                bounds={bounds}
            />}
            {
                props.isFocused &&
                <ContextButtons placement={
                    {
                        x: bounds.x + bounds.width + 5,
                        y: bounds.y
                    }
                }
                />
            }
        </React.Fragment>
    )
}

