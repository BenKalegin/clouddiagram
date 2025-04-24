import React from "react";
import {sequenceDiagramSelector} from "./sequenceDiagramModel";
import {Lifeline} from "./Lifeline";
import {Message} from "./Message";
import {useRecoilValue} from "recoil";
import {DiagramId} from "../diagramEditor/diagramEditorModel";
import {EmptyDiagramHint} from "../diagramEditor/EmptyDiagramHint";
import {Note} from "../commonComponents/Note";
import {VirtualizedLayer, VirtualizedItem} from "../../common/components/VirtualizedLayer";

export const SequenceDiagramEditor = ({diagramId}: { diagramId: DiagramId }) => {
    const diagram = useRecoilValue(sequenceDiagramSelector(diagramId))
    const lifelines = Object.values(diagram.lifelines);
    const messages = Object.values(diagram.messages);
    const notes = Object.values(diagram.notes);

    return (
        <VirtualizedLayer>
            {lifelines.map((lifeline, i) =>
                <VirtualizedItem
                    key={i}
                    getBounds={() => ({
                        x: lifeline.placement.headBounds.x,
                        y: lifeline.placement.headBounds.y,
                        width: lifeline.placement.headBounds.width,
                        height: lifeline.placement.headBounds.height + lifeline.placement.lifelineEnd
                    })}
                >
                    <Lifeline
                        diagramId={diagramId}
                        lifelineId={lifeline.id}
                    />
                </VirtualizedItem>
            )}
            {messages.map((message, i) => {
                // For messages, we need to calculate bounds based on the activations
                const activation1 = diagram.activations[message.activation1];
                const activation2 = diagram.activations[message.activation2];
                const lifeline1 = diagram.lifelines[activation1.lifelineId];
                const lifeline2 = diagram.lifelines[activation2.lifelineId];

                // Calculate approximate bounds for the message
                const x1 = lifeline1.placement.headBounds.x + lifeline1.placement.headBounds.width / 2;
                const x2 = lifeline2.placement.headBounds.x + lifeline2.placement.headBounds.width / 2;
                const y = lifeline1.placement.headBounds.y + lifeline1.placement.headBounds.height + activation1.start + message.sourceActivationOffset;

                return (
                    <VirtualizedItem
                        key={i}
                        getBounds={() => ({
                            x: Math.min(x1, x2),
                            y: y - 10, // Add some padding
                            width: Math.abs(x2 - x1),
                            height: 20 // Approximate height for a message
                        })}
                    >
                        <Message
                            messageId={message.id}
                            diagramId={diagramId}
                        />
                    </VirtualizedItem>
                );
            })}
            {notes.map((note, i) =>
                <VirtualizedItem
                    key={i}
                    getBounds={() => note.bounds}
                >
                    <Note
                        noteId={note.id}
                        diagramId={diagramId}
                    />
                </VirtualizedItem>
            )}
            {lifelines.length === 0 && messages.length === 0 && <EmptyDiagramHint/>}
        </VirtualizedLayer>
    )
}
