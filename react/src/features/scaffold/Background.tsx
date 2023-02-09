import {Bounds, Coordinate, zeroCoordinate} from "../../common/model";
import React from "react";
import {Rect} from "react-konva";
import Konva from "konva";
import {useRecoilTransaction_UNSTABLE} from "recoil";
import {Action} from "@reduxjs/toolkit";
import {elementMoveAction, ElementMovePhase, handleAction} from "../diagramEditor/diagramEditorSlice";
import {Id} from "../../package/packageModel";
import KonvaEventObject = Konva.KonvaEventObject;

export interface BackgroundProps {
    backgroundBounds: Bounds;
    nodeBounds: Bounds;
    originId: Id
    doubleClick: () => void
}

export const Background = (props: BackgroundProps) => {

    const [startNodePos, setStartNodePos] = React.useState<Coordinate>(zeroCoordinate);
    const [startPointerPos, setStartPointerPos] = React.useState<Coordinate>(zeroCoordinate);

    const dispatch = useRecoilTransaction_UNSTABLE(
        ({get, set}) => (action: Action) => {
            handleAction(action, get, set);
        },
        []
    )

    function screenToCanvas(e: KonvaEventObject<DragEvent>) {
        const stage = e.target.getStage()?.getPointerPosition() ?? zeroCoordinate;
        return {x: stage.x, y: stage.y};
    }

    return (
        <Rect
            {...props.backgroundBounds}
            fill={"transparent"}
            stroke={""}
            strokeWidth={0}
            draggable={true}
            onDragStart={(e) => {
                const pos = screenToCanvas(e);
                setStartNodePos(props.nodeBounds);
                setStartPointerPos(pos);
                dispatch(elementMoveAction({
                    phase: ElementMovePhase.start,
                    elementId: props.originId,
                    startNodePos: {x: props.nodeBounds.x, y: props.nodeBounds.y},
                    startPointerPos: pos,
                    currentPointerPos: pos}))
            }}
            onDragMove={(e) => {
                dispatch(elementMoveAction({
                    phase: ElementMovePhase.move,
                    elementId: props.originId,
                    startNodePos: startNodePos,
                    startPointerPos: startPointerPos,
                    currentPointerPos: screenToCanvas(e)}));
            }}
            onDragEnd={(e) => {
                dispatch(elementMoveAction({
                    phase: ElementMovePhase.end,
                    elementId: props.originId,
                    startNodePos: startNodePos,
                    startPointerPos: startPointerPos,
                    currentPointerPos: screenToCanvas(e)}));
                }
            }
            onDblClick={() => props.doubleClick()}
        />
    );
};

