import {Bounds, Coordinate, zeroCoordinate} from "../../common/model";
import React from "react";
import {Rect} from "react-konva";
import Konva from "konva";
import {
    DialogOperation,
    elementMoveAction,
    ElementMoveResizePhase,
    propertiesDialogAction,
    useDispatch
} from "../diagramEditor/diagramEditorSlice";
import {Id} from "../../package/packageModel";
import KonvaEventObject = Konva.KonvaEventObject;

export interface BackgroundProps {
    backgroundBounds: Bounds;
    nodeBounds: Bounds;
    originId: Id
}

export const Background = (props: BackgroundProps) => {

    const [startNodePos, setStartNodePos] = React.useState<Coordinate | undefined>();
    const [startPointerPos, setStartPointerPos] = React.useState<Coordinate | undefined>();

    const dispatch = useDispatch()

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
                    phase: ElementMoveResizePhase.start,
                    elementId: props.originId,
                    startNodePos: {x: props.nodeBounds.x, y: props.nodeBounds.y},
                    startPointerPos: pos,
                    currentPointerPos: pos}))
            }}
            onDragMove={(e) => {
                // check required because DragMove event can be received before DragStart updated the state
                if (startPointerPos && startNodePos)
                    dispatch(elementMoveAction({
                        phase: ElementMoveResizePhase.move,
                        elementId: props.originId,
                        startNodePos: startNodePos,
                        startPointerPos: startPointerPos,
                        currentPointerPos: screenToCanvas(e)}));
            }}

            onDragEnd={(e) => {
                // check required because DragMove event can be received before DragStart updated the state
                if (startPointerPos && startNodePos)
                    dispatch(elementMoveAction({
                    phase: ElementMoveResizePhase.end,
                    elementId: props.originId,
                    startNodePos: startNodePos,
                    startPointerPos: startPointerPos,
                    currentPointerPos: screenToCanvas(e)}));
                }
            }
            onDblClick={() =>
                dispatch(propertiesDialogAction({
                    elementId: props.originId, dialogResult: DialogOperation.open
                }))
            }
        />
    );
};

