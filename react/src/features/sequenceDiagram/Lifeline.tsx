import {Group, Line, Rect, Text} from "react-konva";
import {
    LifelineId,
    lifelinePoints,
    lifelineSelector
} from "./sequenceDiagramModel";
import React, {FC} from "react";
import {Scaffold} from "../scaffold/Scaffold";
import {Activation} from "./Activation";
import {DrawingMessage} from "./DrawingMessage";
import {useRecoilState, useRecoilValue} from "recoil";
import {DiagramId, linkingAtom, selectedElementsAtom} from "../diagramEditor/diagramEditorModel";
import {
    elementMoveAction,
    ElementMoveResizePhase,
    screenToCanvas,
    useDispatch
} from "../diagramEditor/diagramEditorSlice";
import {Coordinate} from "../../common/model";

export interface LifelineProps {
    lifelineId: LifelineId
    diagramId: DiagramId
}

export const Lifeline: FC<LifelineProps> = ({lifelineId, diagramId}) => {
    const [selectedElements, setSelectedElements] = useRecoilState(selectedElementsAtom)
    const isSelected = selectedElements.includes(lifelineId);
    const isFocused = selectedElements.length > 0 && selectedElements.at(-1) === lifelineId;
    const lifeline = useRecoilValue(lifelineSelector({lifelineId, diagramId}))
    const placement = lifeline.placement
    const [startNodePos, setStartNodePos] = React.useState<Coordinate | undefined>();
    const [startPointerPos, setStartPointerPos] = React.useState<Coordinate | undefined>();
    const dispatch = useDispatch()
    const linking = useRecoilValue(linkingAtom)

    return <Group>
        <Rect
            fill={"cornsilk"}
            stroke={"peru"}
            strokeWidth={1}
            x={placement.headBounds.x}
            y={placement.headBounds.y}
            width={placement.headBounds.width}
            height={placement.headBounds.height}
            shadowColor={'black'}
            shadowBlur={3}
            shadowOffset={{x: 2, y: 2}}
            shadowOpacity={0.4}
            onClick={() => setSelectedElements([lifelineId])}
            draggable={true}
            dragBoundFunc={(pos) => ({
                x: pos.x,
                y: startNodePos ? startNodePos.y : pos.y
            })}
            onDragStart={(e) => {
                const pos = screenToCanvas(e);
                setStartNodePos(placement.headBounds);
                setStartPointerPos(pos);
                setSelectedElements([lifelineId])

                dispatch(elementMoveAction({
                    phase: ElementMoveResizePhase.start,
                    elementId: lifelineId,
                    startNodePos: {x: placement.headBounds.x, y: placement.headBounds.y},
                    startPointerPos: pos,
                    currentPointerPos: pos}))
            }}
            onDragMove={(e) => {
                // check required because DragMove event can be received before DragStart updated the state
                if (startPointerPos && startNodePos)
                    dispatch(elementMoveAction({
                        phase: ElementMoveResizePhase.move,
                        elementId: lifelineId,
                        startNodePos: startNodePos,
                        startPointerPos: startPointerPos,
                        currentPointerPos: screenToCanvas(e)}));
            }}

            onDragEnd={(e) => {
                // check required because DragMove event can be received before DragStart updated the state
                if (startPointerPos && startNodePos)
                    dispatch(elementMoveAction({
                        phase: ElementMoveResizePhase.end,
                        elementId: lifelineId,
                        startNodePos: startNodePos,
                        startPointerPos: startPointerPos,
                        currentPointerPos: screenToCanvas(e)}));
            }}
        />
        <Text
            {...placement.headBounds}
            fontSize={14}
            align={"center"}
            verticalAlign={"middle"}
            text={lifeline.title}
            draggable={false}
            listening={false}
            preventDefault={true}
        />
        <Line
            stroke={'burlywood'}
            strokeWidth={2}
            dash={[5, 3]}

            x={placement.headBounds.x}
            y={placement.headBounds.y}
            points={lifelinePoints(placement.headBounds, placement.lifelineEnd)}
        />
        {lifeline.activations.map((activation, i) =>
            <Activation
                key={i}
                activationId={activation}
                diagramId={diagramId}
            />
        )
        }
        {isSelected && <Scaffold
                elementId={lifelineId}
                bounds={{
                    ...placement.headBounds,
                    height: placement.headBounds.y + placement.lifelineEnd
                }}
                excludeDiagonalResize={true}
                excludeVerticalResize={true}
                isFocused={isFocused}
                isLinking={linking?.drawing === true}
                linkingDrawing={<DrawingMessage/> }
            />}

    </Group>
}
