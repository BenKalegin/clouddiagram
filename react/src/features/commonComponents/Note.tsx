import {NoteId, noteSelector} from "./commonComponentsModel";
import {DiagramId, selectedRefsSelector} from "../diagramEditor/diagramEditorModel";
import {Group, Rect, Text} from "react-konva";
import {useRecoilValue} from "recoil";

export const Note = ({noteId, diagramId}: { noteId: NoteId, diagramId: DiagramId }) => {
    const selectedElements = useRecoilValue(selectedRefsSelector(diagramId))
    const isSelected = selectedElements.map(e => e.id).includes(noteId)
    const isFocused = selectedElements.length > 0 && selectedElements.at(-1)?.id === noteId;

    const note = useRecoilValue(noteSelector({noteId, diagramId}))

    return (
        <Group>
            <Rect
                {...note.bounds}
                fill="white"
                stroke="black"
                strokeWidth={0.5}
                cornerRadius={0}
            />
            <Text
                text={note.text}
                fontSize={14}
                {...note.bounds}
                align={"center"}
                verticalAlign={"middle"}
            />
        </Group>
    )
}
