import {
    elementMoveAction,
    ElementMoveResizePhase,
    elementSelectedAction,
    screenToCanvas,
    useDispatch
} from "./diagramEditorSlice";
import {KonvaNodeEvents} from "react-konva/ReactKonvaCore";
import {ElementRef} from "../../package/packageModel";
import React from "react";
import {Bounds, Coordinate} from "../../common/model";
import {DiagramId, selectedRefsSelector} from "./diagramEditorModel";
import {useRecoilValue} from "recoil";
import {Vector2d} from "konva/lib/types";
import {Node} from "konva/lib/Node";

interface CustomDispatchOptions {
    onClick?: boolean;
    onDrag?: boolean;
    disableVerticalDrag?: boolean;
    element: ElementRef
    diagramId: DiagramId
    bounds: Bounds
}


interface  DragBoundFunc{
    dragBoundFunc?: (this: Node, pos: Vector2d) => Vector2d;
}

export const useCustomDispatch = ({
    element,
    bounds,
    diagramId,
    onClick = true,
    onDrag = true,
    disableVerticalDrag = false
}: CustomDispatchOptions) => {
    const dispatch = useDispatch();
    const selectedElements = useRecoilValue(selectedRefsSelector(diagramId))
    const isSelected = selectedElements.map(e => e.id).includes(element.id)
    const [startNodePos, setStartNodePos] = React.useState<Coordinate | undefined>();
    const [startPointerPos, setStartPointerPos] = React.useState<Coordinate | undefined>();


    const eventHandlers: Partial<KonvaNodeEvents> & DragBoundFunc = {};

    if (onClick) {
        eventHandlers.onClick = (e) => dispatch(elementSelectedAction({element, shiftKey: e.evt.shiftKey, ctrlKey: e.evt.ctrlKey}))
    }

    if (onDrag) {
        eventHandlers.onDragStart =(e) => {
            const pos = screenToCanvas(e);
            setStartNodePos(bounds);
            setStartPointerPos(pos);
            if (!isSelected)
                dispatch(elementSelectedAction({element, shiftKey: e.evt.shiftKey, ctrlKey: e.evt.ctrlKey}))

            dispatch(elementMoveAction({
                phase: ElementMoveResizePhase.start,
                element: element,
                startNodePos: {x: bounds.x, y: bounds.y},
                startPointerPos: pos,
                currentPointerPos: pos}))
        }
        eventHandlers.onDragMove=(e) => {
        // check required because DragMove event can be received before DragStart updated the state
        if (startPointerPos && startNodePos)
            dispatch(elementMoveAction({
                phase: ElementMoveResizePhase.move,
                element,
                startNodePos: startNodePos,
                startPointerPos: startPointerPos,
                currentPointerPos: screenToCanvas(e)}));
        }

        eventHandlers.onDragEnd=(e) => {
        // check required because DragMove event can be received before DragStart updated the state
        if (startPointerPos && startNodePos)
            dispatch(elementMoveAction({
                phase: ElementMoveResizePhase.end,
                element,
                startNodePos: startNodePos,
                startPointerPos: startPointerPos,
                currentPointerPos: screenToCanvas(e)}));
        }

        if (disableVerticalDrag)
            eventHandlers.dragBoundFunc=(pos) => ({
                x: pos.x,
                y: startNodePos ? startNodePos.y : pos.y
            })
    }

    return eventHandlers;
};
