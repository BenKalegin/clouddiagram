import {NoteId, noteSelector} from "./commonComponentsModel";
import {DiagramId, linkingAtom, selectedRefsSelector} from "../diagramEditor/diagramEditorModel";
import {Group, Shape, Text} from "react-konva";
import {useRecoilValue} from "recoil";
import {Scaffold} from "../scaffold/Scaffold";
import {ElementRef, ElementType} from "../../package/packageModel";
import {DrawingMessage} from "../sequenceDiagram/DrawingMessage";
import React from "react";
import {
    elementMoveAction, ElementMoveResizePhase,
    elementSelectedAction,
    screenToCanvas,
    useDispatch
} from "../diagramEditor/diagramEditorSlice";
import {Coordinate} from "../../common/model";

export const Note = ({noteId, diagramId}: { noteId: NoteId, diagramId: DiagramId }) => {
    const selectedElements = useRecoilValue(selectedRefsSelector(diagramId))
    const isSelected = selectedElements.map(e => e.id).includes(noteId)
    const isFocused = selectedElements.length > 0 && selectedElements.at(-1)?.id === noteId;
    const linking = useRecoilValue(linkingAtom)
    const dispatch = useDispatch()
    const [startNodePos, setStartNodePos] = React.useState<Coordinate | undefined>();
    const [startPointerPos, setStartPointerPos] = React.useState<Coordinate | undefined>();

    const note = useRecoilValue(noteSelector({noteId, diagramId}))
    const cornerSize = 10;
    const width = note.bounds.width;
    const height = note.bounds.height;
    const element: ElementRef = {id: noteId, type: ElementType.Note}

    return (
        <Group>
            <Shape
                x={note.bounds.x}
                y={note.bounds.y}
                fill={note.shapeStyle.fillColor}
                stroke={note.shapeStyle.strokeColor}
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

                onClick={(e) => {
                    dispatch(elementSelectedAction({element, shiftKey: e.evt.shiftKey, ctrlKey: e.evt.ctrlKey}))
                }}

                onDragStart={(e) => {
                    const pos = screenToCanvas(e);
                    setStartNodePos(note.bounds);
                    setStartPointerPos(pos);
                    if (!isSelected)
                        dispatch(elementSelectedAction({element, shiftKey: e.evt.shiftKey, ctrlKey: e.evt.ctrlKey}))

                    dispatch(elementMoveAction({
                        phase: ElementMoveResizePhase.start,
                        element,
                        startNodePos: {x: note.bounds.x, y: note.bounds.y},
                        startPointerPos: pos,
                        currentPointerPos: pos}))
                }}
                onDragMove={(e) => {
                    if (startPointerPos && startNodePos)
                        dispatch(elementMoveAction({
                            phase: ElementMoveResizePhase.move,
                            element,
                            startNodePos: startNodePos,
                            startPointerPos: startPointerPos,
                            currentPointerPos: screenToCanvas(e)}));
                }}

                onDragEnd={(e) => {
                    // check required because DragMove event can be received before DragStart updated the state
                    if (startPointerPos && startNodePos)
                        dispatch(elementMoveAction({
                            phase: ElementMoveResizePhase.end,
                            element,
                            startNodePos: startNodePos,
                            startPointerPos: startPointerPos,
                            currentPointerPos: screenToCanvas(e)}));
                }}


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
