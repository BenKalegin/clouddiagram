import {NoteId, noteSelector} from "./commonComponentsModel";
import {DiagramId, linkingAtom, selectedRefsSelector} from "../diagramEditor/diagramEditorModel";
import {Group, Shape, Text} from "react-konva";
import {useRecoilValue} from "recoil";
import {Scaffold} from "../scaffold/Scaffold";
import {ElementRef, ElementType} from "../../package/packageModel";
import {DrawingMessage} from "../sequenceDiagram/DrawingMessage";
import React from "react";
import {useCustomDispatch} from "../diagramEditor/commonHandlers";

export const Note = ({noteId, diagramId}: { noteId: NoteId, diagramId: DiagramId }) => {
    const selectedElements = useRecoilValue(selectedRefsSelector(diagramId))
    const isSelected = selectedElements.map(e => e.id).includes(noteId)
    const isFocused = selectedElements.length > 0 && selectedElements.at(-1)?.id === noteId;
    const linking = useRecoilValue(linkingAtom)

    const note = useRecoilValue(noteSelector({noteId, diagramId}))
    const cornerSize = 10;
    const width = note.bounds.width;
    const height = note.bounds.height;
    const element: ElementRef = {id: noteId, type: ElementType.Note}

    const eventHandlers = useCustomDispatch({
        onClick: true,
        onDrag: true,
        element: element,
        diagramId: diagramId,
        bounds: note.bounds,
    });

    return (
        <Group>
            <Shape
                x={note.bounds.x}
                y={note.bounds.y}
                fill={note.colorSchema.fillColor}
                stroke={note.colorSchema.strokeColor}
                strokeWidth={1}

                sceneFunc={(context, shape) => {
                    context.beginPath();
                    context.moveTo(0, 0);
                    context.lineTo(width - cornerSize, 0);
                    context.lineTo(width, cornerSize);
                    context.lineTo(width, height);
                    context.lineTo(0, height);
                    context.lineTo(0, 0);
                    context.closePath();
                    context.fillStrokeShape(shape);

                    context.beginPath();
                    context.moveTo(width - cornerSize, 0);
                    context.lineTo(width - cornerSize, cornerSize);
                    context.lineTo(width, cornerSize);
                    context.closePath();
                    context.strokeShape(shape);
                }}

                {...eventHandlers}
                draggable={true}

            />
            <Text
                text={note.text}
                fontSize={14}
                {...note.bounds}
                align={"center"}
                verticalAlign={"middle"}
                draggable={false}
                listening={false}
                preventDefault={true}
            />
            {isSelected && <Scaffold
                element={{id: noteId, type: ElementType.Note}}
                bounds={{...note.bounds}}
                excludeDiagonalResize={false}
                excludeVerticalResize={false}
                isFocused={isFocused}
                isLinking={linking?.drawing === true}
                linkingDrawing={<DrawingMessage/> }
            />}

        </Group>
    )
}
