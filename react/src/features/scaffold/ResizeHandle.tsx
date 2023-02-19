import {Bounds, Coordinate, minus, zeroCoordinate} from "../../common/model";
import React from "react";
import {Rect} from "react-konva";
import {enumKeys} from "../../common/EnumUtils";
import {
    ElementMoveResizePhase,
    elementResizeAction,
    useDispatch
} from "../diagramEditor/diagramEditorSlice";
import {Id} from "../../package/packageModel";
import Konva from "konva";
import KonvaEventObject = Konva.KonvaEventObject;
import Vector2d = Konva.Vector2d;

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
    elementId: Id
    cursor: string;
    handlerBounds: Bounds;
    direction: ResizeHandleDirection;
    nodeBounds: Bounds;
}

export const ResizeHandle = (props: ResizeHandleProps) => {
    const [startPointerPos, setStartPointerPos] = React.useState<Coordinate | undefined>();
    const [startHandlerPos, setStartHandlerPos] = React.useState<Coordinate | undefined>();
    const [startBounds, setStartBounds] = React.useState<Bounds | undefined>();


    const dispatch = useDispatch();

    function screenToCanvas(e: KonvaEventObject<DragEvent>) {
        const stage = e.target.getStage()?.getPointerPosition() ?? zeroCoordinate;
        return {x: stage.x, y: stage.y};
    }

    const minHeight = 10;
    const minWidth = 20;

    const calculateResizedBounds = (delta: Coordinate, original: Bounds, direction: ResizeHandleDirection): Bounds => {
        switch (direction) {
            case ResizeHandleDirection.North:
                return {
                    x: original.x,
                    y: Math.min(original.y + delta.y, original.y + original.height - minHeight),
                    width: original.width,
                    height: original.height - delta.y
                };
            case ResizeHandleDirection.South:
                return {
                    x: original.x,
                    y: original.y,
                    width: original.width,
                    height: Math.max(original.height + delta.y, minHeight)
                };
            case ResizeHandleDirection.West:
                return {
                    x: Math.min(original.x + delta.x, original.x + original.width - minWidth),
                    y: original.y,
                    width: original.width - delta.x,
                    height: original.height
                };
            case ResizeHandleDirection.East:
                return {
                    x: original.x,
                    y: original.y,
                    width: Math.max(original.width + delta.x, minWidth),
                    height: original.height
                };
            case ResizeHandleDirection.NorthEast:
                return {
                    x: original.x,
                    y: Math.min(original.y + delta.y, original.y + original.height - minHeight),
                    width: Math.max(original.width + delta.x, minWidth),
                    height: original.height - delta.y
                };
            case ResizeHandleDirection.NorthWest:
                return {
                    x: Math.min(original.x + delta.x, original.x + original.width - minWidth),
                    y: Math.min(original.y + delta.y, original.y + original.height - minHeight),
                    width: original.width - delta.x,
                    height: original.height - delta.y
                };
            case ResizeHandleDirection.SouthEast:
                return {
                    x: original.x,
                    y: original.y,
                    width: Math.max(original.width + delta.x, minWidth),
                    height: Math.max(original.height + delta.y, minHeight)
                };
            case ResizeHandleDirection.SouthWest:
                return {
                    x: Math.min(original.x + delta.x, original.x + original.width - minWidth),
                    y: original.y,
                    width: original.width - delta.x,
                    height: Math.max(original.height + delta.y, minHeight)
                };
        }

    };


    const bounds = props.handlerBounds;

    function limitDrag(pos: Vector2d) {
        if (!startBounds || !startPointerPos || !startHandlerPos)
            return pos;

        switch(props.direction) {
            case ResizeHandleDirection.North:
                return {
                    x: startPointerPos.x,
                    y: Math.min(pos.y, startHandlerPos.y + startBounds.height - minHeight)
                }
            case ResizeHandleDirection.South:
                return {
                    x: startPointerPos.x,
                    y: Math.max(pos.y, startHandlerPos.y + minHeight)
                }
            case ResizeHandleDirection.East:
                return {
                    x: Math.max(pos.x, startPointerPos.x + startBounds.width - minWidth),
                    y: startPointerPos.y
                }
            case ResizeHandleDirection.West:
                return {
                    x: Math.min(pos.x, startPointerPos.x + startBounds.width - minWidth),
                    y: startPointerPos.y
                }
            case ResizeHandleDirection.NorthEast:
                return {
                    x: Math.max(pos.x, startPointerPos.x + startBounds.width - minWidth),
                    y: Math.min(pos.y, startHandlerPos.y + startBounds.height - minHeight)
                }
            case ResizeHandleDirection.NorthWest:
                return {
                    x: Math.min(pos.x, startPointerPos.x + startBounds.width - minWidth),
                    y: Math.min(pos.y, startHandlerPos.y + startBounds.height - minHeight)
                }
            case ResizeHandleDirection.SouthEast:
                return {
                    x: Math.max(pos.x, startPointerPos.x + startBounds.width - minWidth),
                    y: Math.max(pos.y, startHandlerPos.y + minHeight)
                }
            case ResizeHandleDirection.SouthWest:
                return {
                    x: Math.max(pos.x, startPointerPos.x + startBounds.width - minWidth),
                    y: Math.max(pos.y, startHandlerPos.y + minHeight)
                }
        }
    }

    return <Rect
        {...bounds}
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
        // dragBoundFunc={(pos) => limitDrag(pos)}

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

        dragBoundFunc={(pos) => limitDrag(pos)}

        onDragStart={(e) => {
            const pos = screenToCanvas(e);
            setStartPointerPos(pos);
            setStartHandlerPos({x: bounds.x, y: bounds.y})
            setStartBounds(props.nodeBounds);

            dispatch(elementResizeAction({
                phase: ElementMoveResizePhase.start,
                elementId: props.elementId,
                suggestedBounds: props.nodeBounds,
            }))
        }}

        onDragMove={(e) => {
            if (startPointerPos) {
                const delta = minus(screenToCanvas(e), startPointerPos);
                const suggestedBounds = calculateResizedBounds(delta, props.nodeBounds, props.direction);
                dispatch(elementResizeAction({
                    phase: ElementMoveResizePhase.move,
                    elementId: props.elementId,
                    suggestedBounds: suggestedBounds
                }));
            }
        }}
        onDragEnd={(e) => {
            if (startPointerPos) {
                const delta = minus(screenToCanvas(e), startPointerPos);
                setStartPointerPos(undefined);
                setStartHandlerPos(undefined);
                setStartBounds(undefined);
                dispatch(elementResizeAction({
                    phase: ElementMoveResizePhase.end,
                    elementId: props.elementId,
                    suggestedBounds: calculateResizedBounds(delta, props.nodeBounds, props.direction)
                }));
            }
            setStartPointerPos(undefined);
            setStartHandlerPos(undefined);
            setStartBounds(undefined);
        }}
    />;
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

export const ResizeHandles = ({nodeBounds, perimeterBounds, elementId}: { perimeterBounds: Bounds, nodeBounds: Bounds, elementId: Id }) => {

    const [nodeStart] = React.useState<Bounds>(nodeBounds);
    return (
        <>
            {enumKeys(ResizeHandleDirection).map((direction, index) =>
                <ResizeHandle
                    key={index}
                    elementId={elementId}
                    handlerBounds={resizeHandleBounds(ResizeHandleDirection[direction], perimeterBounds)}
                    nodeBounds={nodeStart}
                    cursor={resizeHandleCursor(ResizeHandleDirection[direction])}
                    direction={ResizeHandleDirection[direction]}
                />
            )}
        </>
    )
}
