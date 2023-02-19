import React, {RefObject} from "react";
import Konva from "konva";
import {Layer, Stage} from "react-konva";
import {sequenceDiagramSelector} from "./sequenceDiagramModel";
import {Lifeline} from "./Lifeline";
import {Message} from "./Message";
import {useRecoilBridgeAcrossReactRoots_UNSTABLE, useRecoilState, useRecoilValue} from "recoil";
import {DiagramId, selectedElementsAtom} from "../diagramEditor/diagramEditorModel";

export const SequenceDiagramEditor = ({diagramId}: { diagramId: DiagramId }) => {
    const diagram = useRecoilValue(sequenceDiagramSelector(diagramId))
    const [, setSelectedElements] = useRecoilState(selectedElementsAtom)
    const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // deselect when clicked on empty area
        const clickedOnEmpty = e.target === e.target.getStage()
        if (clickedOnEmpty) {
            setSelectedElements([])
        }
    }

    const Bridge = useRecoilBridgeAcrossReactRoots_UNSTABLE();
    const stageRef: RefObject<Konva.Stage> = React.useRef(null);

    return (
        <Stage
            width={window.innerWidth}
            height={window.innerHeight}
            ref={stageRef}
            onMouseDown={e => checkDeselect(e)}
        >
            <Bridge>
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
            </Bridge>
        </Stage>
    )
}
