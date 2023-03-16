import React from "react";
import {Layer} from "react-konva";
import {sequenceDiagramSelector} from "./sequenceDiagramModel";
import {Lifeline} from "./Lifeline";
import {Message} from "./Message";
import {useRecoilValue} from "recoil";
import {DiagramId} from "../diagramEditor/diagramEditorModel";

export const SequenceDiagramEditor = ({diagramId}: { diagramId: DiagramId }) => {
    const diagram = useRecoilValue(sequenceDiagramSelector(diagramId))
    return (
        <Layer>
            {Object.values(diagram.lifelines).map((lifeline, i) => {
                return (
                    <Lifeline
                        key={i}
                        diagramId={diagramId}
                        lifelineId={lifeline.id}
                    />
                );
            })}
            {Object.values(diagram.messages).map((message, i) => {
                return (
                    <Message
                        key={i}
                        messageId={message.id}
                        diagramId={diagramId}
                    />
                )
            })}
        </Layer>
    )
}
