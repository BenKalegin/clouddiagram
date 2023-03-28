import {Arrow, Group, Text} from "react-konva";
import {useRecoilValue} from "recoil";
import {ElementType, Id, IdAndKind} from "../../package/packageModel";
import {messageRenderSelector, messageSelector} from "./sequenceDiagramModel";
import {DiagramId, selectedRefsSelector} from "../diagramEditor/diagramEditorModel";
import {Scaffold} from "../scaffold/Scaffold";
import React from "react";
import {elementSelectedAction, useDispatch} from "../diagramEditor/diagramEditorSlice";
import {Bounds} from "../../common/model";

export const Message = ({messageId, diagramId}: {messageId: Id, diagramId: DiagramId  }) => {
    const render = useRecoilValue(messageRenderSelector({messageId, diagramId}))
    const message = useRecoilValue(messageSelector({messageId, diagramId}))
    const textWidth = 40;
    const textHeight = 20;
    const textShiftUp = textHeight + 2;

    const textBounds: Bounds = {
        x: render.bounds.x + render.bounds.width / 2 - textWidth / 2,
        y: render.bounds.y - textShiftUp,
        width: textWidth, height: textHeight}

    const selectedElements = useRecoilValue(selectedRefsSelector(diagramId))
    const isSelected = selectedElements.map(e => e.id).includes(messageId);
    const isFocused = selectedElements.length > 0 && selectedElements.at(-1)?.id === messageId;
    const dispatch = useDispatch()

    const dash = message.isReturn ? [5, 4] : undefined;

    return (
        <Group>
            <Arrow
                fill={"burlywood"}
                stroke={'burlywood'}
                dash={dash}
                strokeWidth={2}
                pointerLength={8}
                pointerWidth={6}
                tension={undefined}
                closed={undefined}
                pointerAtBeginning={false}
                pointerAtEnding={true}
                hitStrokeWidth={10}
                onClick={(e) => {
                    const element: IdAndKind = {id: messageId, type: ElementType.SequenceMessage}
                    dispatch(elementSelectedAction({element, shiftKey: e.evt.shiftKey, ctrlKey: e.evt.ctrlKey}))
                }}

                x={render.bounds.x}
                y={render.bounds.y}
                points={render.points}
            />
            <Text
                {...textBounds}
                fontSize={14}
                align={"center"}
                verticalAlign={"middle"}
                text={message.text}
                draggable={false}
                listening={false}
                preventDefault={true}
                visible={!!message.text}
            />
            {isSelected && <Scaffold
                element={{id: messageId, type: ElementType.SequenceMessage}}
                bounds={render.bounds}
                excludeDiagonalResize={true}
                excludeVerticalResize={true}
                isFocused={isFocused}
                isLinking={false}
                linkingDrawing={undefined}
            />}
        </Group>

    )
}
