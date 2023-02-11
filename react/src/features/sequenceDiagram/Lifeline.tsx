import {Group, Line, Rect, Text} from "react-konva";
import {LifelineId, lifelinePlacementSelector, lifelinePoints, LifelineState} from "./model";
import React, {FC} from "react";
import {Scaffold} from "../scaffold/Scaffold";
import {Activation} from "./Activation";
import {DrawingMessage} from "./DrawingMessage";
import {useRecoilState, useRecoilValue} from "recoil";
import {DiagramId, elementsAtom, selectedElementsAtom} from "../diagramEditor/diagramEditorModel";

export interface LifelineProps {
    lifelineId: LifelineId
    diagramId: DiagramId
}

export const Lifeline: FC<LifelineProps> = ({lifelineId, diagramId}) => {
    const [selectedElements, setSelectedElements] = useRecoilState(selectedElementsAtom)
    const isSelected = selectedElements.includes(lifelineId);
    const isFocused = selectedElements.length > 0 && selectedElements.at(-1) === lifelineId;
    const placement = useRecoilValue(lifelinePlacementSelector({lifelineId, diagramId}))
    const lifeline = useRecoilValue(elementsAtom(lifelineId)) as LifelineState
    return (
        <Group>
            <Rect
                fill={"cornsilk"}
                stroke={"peru"}
                strokeWidth={1}
                {...placement.headBounds}
                shadowColor={'black'}
                shadowBlur={3}
                shadowOffset={{x: 2, y: 2}}
                shadowOpacity={0.4}
                onClick={() => setSelectedElements([lifelineId])}
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
                stroke={'burlywood'}
                strokeWidth={2}
                dash={[5, 3]}

                x={placement.headBounds.x}
                y={placement.headBounds.y}
                points={lifelinePoints(placement.headBounds, placement.lifelineEnd)}
            />
            {lifeline.activations.map((activation, i) =>
                <Activation
                    key={i}
                    activationId={activation}
                    diagramId={diagramId}
                />
            )
            }
            {isSelected && (
                <Scaffold
                    elementId={lifelineId}
                    bounds={{
                        ...placement.headBounds,
                        height: placement.headBounds.y + placement.lifelineEnd
                    }}
                    isFocused={isFocused}
                    isLinking={false}
                    linkingDrawing={<DrawingMessage lifelineId={lifelineId} diagramId={diagramId}  /> }
                />
            )}

        </Group>
    )
}
