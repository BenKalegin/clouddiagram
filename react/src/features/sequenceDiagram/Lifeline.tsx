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
import {useRecoilValue} from "recoil";
import {
    DiagramId,
    linkingAtom,
    selectedRefsSelector
} from "../diagramEditor/diagramEditorModel";
import {
    elementMoveAction,
    ElementMoveResizePhase, elementSelectedAction,
    screenToCanvas,
    useDispatch
} from "../diagramEditor/diagramEditorSlice";
import {Coordinate} from "../../common/model";
import {ElementType, ElementRef} from "../../package/packageModel";

export interface LifelineProps {
    lifelineId: LifelineId
    diagramId: DiagramId
}

export const Lifeline: FC<LifelineProps> = ({lifelineId, diagramId}) => {
    const selectedElements = useRecoilValue(selectedRefsSelector(diagramId))
    const isSelected = selectedElements.map(e => e.id).includes(lifelineId);
    const isFocused = selectedElements.length > 0 && selectedElements.at(-1)?.id === lifelineId;
    const lifeline = useRecoilValue(lifelineSelector({lifelineId, diagramId}))
    const placement = lifeline.placement
    const [startNodePos, setStartNodePos] = React.useState<Coordinate | undefined>();
    const [startPointerPos, setStartPointerPos] = React.useState<Coordinate | undefined>();
    const dispatch = useDispatch()
    const linking = useRecoilValue(linkingAtom)

    return <Group>
        <Rect
            fill={lifeline.shapeStyle.fillColor}
            stroke={lifeline.shapeStyle.strokeColor}
            strokeWidth={1}
            x={placement.headBounds.x}
            y={placement.headBounds.y}
            width={placement.headBounds.width}
            height={placement.headBounds.height}
            shadowColor={'black'}
            shadowBlur={3}
            shadowOffset={{x: 2, y: 2}}
            shadowOpacity={0.4}
            onClick={(e) => {
                const element: ElementRef = {id: lifelineId, type: ElementType.SequenceLifeLine}
                dispatch(elementSelectedAction({element, shiftKey: e.evt.shiftKey, ctrlKey: e.evt.ctrlKey}))
            }}
            draggable={true}
            dragBoundFunc={(pos) => ({
                x: pos.x,
                y: startNodePos ? startNodePos.y : pos.y
            })}
            onDragStart={(e) => {
                const pos = screenToCanvas(e);
                setStartNodePos(placement.headBounds);
                setStartPointerPos(pos);
                const element: ElementRef = {id: lifelineId, type: ElementType.SequenceLifeLine}
                if (!isSelected)
                    dispatch(elementSelectedAction({element, shiftKey: e.evt.shiftKey, ctrlKey: e.evt.ctrlKey}))

                dispatch(elementMoveAction({
                    phase: ElementMoveResizePhase.start,
                    element: { id: lifelineId, type: ElementType.SequenceLifeLine },
                    startNodePos: {x: placement.headBounds.x, y: placement.headBounds.y},
                    startPointerPos: pos,
                    currentPointerPos: pos}))
            }}
            onDragMove={(e) => {
                // check required because DragMove event can be received before DragStart updated the state
                if (startPointerPos && startNodePos)
                    dispatch(elementMoveAction({
                        phase: ElementMoveResizePhase.move,
                        element: { id: lifelineId, type: ElementType.SequenceLifeLine },
                        startNodePos: startNodePos,
                        startPointerPos: startPointerPos,
                        currentPointerPos: screenToCanvas(e)}));
            }}

            onDragEnd={(e) => {
                // check required because DragMove event can be received before DragStart updated the state
                if (startPointerPos && startNodePos)
                    dispatch(elementMoveAction({
                        phase: ElementMoveResizePhase.end,
                        element: { id: lifelineId, type: ElementType.SequenceLifeLine },
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
            stroke={lifeline.shapeStyle.strokeColor}
            strokeWidth={2}
            dash={[5, 3]}

            x={placement.headBounds.x}
            y={placement.headBounds.y}
            points={lifelinePoints(placement.headBounds, placement.lifelineEnd, placement.lifelineStart)}
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
                element={{id: lifelineId, type: ElementType.SequenceLifeLine}}
                bounds={{
                    ...placement.headBounds,
                    height: placement.headBounds.y + placement.headBounds.height + placement.lifelineEnd
                }}
                excludeDiagonalResize={true}
                excludeVerticalResize={true}
                isFocused={isFocused}
                isLinking={linking?.drawing === true}
                linkingDrawing={<DrawingMessage/> }
            />}

    </Group>
}
