import React from "react";
import {Layer} from "react-konva";
import {sequenceDiagramSelector} from "./sequenceDiagramModel";
import {Lifeline} from "./Lifeline";
import {Message} from "./Message";
import {useRecoilValue} from "recoil";
import {DiagramId} from "../diagramEditor/diagramEditorModel";
import {EmptyDiagramHint} from "../diagramEditor/EmptyDiagramHint";
import {Note} from "../commonComponents/Note";

export const SequenceDiagramEditor = ({diagramId}: { diagramId: DiagramId }) => {
    const diagram = useRecoilValue(sequenceDiagramSelector(diagramId))
    const lifelines = Object.values(diagram.lifelines);
    const messages = Object.values(diagram.messages);
    const notes = Object.values(diagram.notes);

    return (
        <Layer>
            {lifelines.map((lifeline, i) =>
                <Lifeline
                    key={i}
                    diagramId={diagramId}
                    lifelineId={lifeline.id}
                />)}
            {messages.map((message, i) =>
                <Message
                    key={i}
                    messageId={message.id}
                    diagramId={diagramId}
                />)}
            {notes.map((note, i) =>
                <Note
                    key={i}
                    noteId={note.id}
                    diagramId={diagramId}
                />)}
            {lifelines.length === 0 && messages.length === 0 && <EmptyDiagramHint/>}
        </Layer>
    )
}
