import {Arrow, Group} from "react-konva";
import {useRecoilState, useRecoilValue} from "recoil";
import {ElementType, Id} from "../../package/packageModel";
import {messageRenderSelector} from "./sequenceDiagramModel";
import {DiagramId, selectedElementsAtom} from "../diagramEditor/diagramEditorModel";
import {Scaffold} from "../scaffold/Scaffold";
import React from "react";

export const Message = ({messageId, diagramId}: {messageId: Id, diagramId: DiagramId  }) => {
    const render = useRecoilValue(messageRenderSelector({messageId, diagramId}))
    const [selectedElements, setSelectedElements] = useRecoilState(selectedElementsAtom)
    const isSelected = selectedElements.map(e => e.id).includes(messageId);
    const isFocused = selectedElements.length > 0 && selectedElements.at(-1)?.id === messageId;

    return (
        <Group>
            <Arrow
                fill={"burlywood"}
                stroke={'burlywood'}
                strokeWidth={2}
                pointerLength={8}
                pointerWidth={6}
                tension={undefined}
                closed={undefined}
                pointerAtBeginning={false}
                pointerAtEnding={true}
                hitStrokeWidth={10}
                onClick={() => setSelectedElements([{id: messageId, type: ElementType.SequenceMessage}])}


                x={render.bounds.x}
                y={render.bounds.y}
                points={render.points}
            />
            {isSelected && <Scaffold
                elementId={messageId}
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
