import {Group, Line, Rect, Text} from "react-konva";
import {lifelinePoints, LifelineState} from "./model";
import React from "react";
import {Scaffold} from "../scaffold/Scaffold";
import {nodeResize, nodeSelect} from "../classDiagram/diagramEditorSlice";
import {useAppDispatch} from "../../app/hooks";
import {Activation} from "./Activation";
import {DrawingMessage} from "./DrawingMessage";

export interface LifelineProps {
    isSelected: boolean;
    isFocused: boolean;
    isLinking: boolean;
    lifeline: LifelineState;
}


export const Lifeline = (props: LifelineProps) => {
    const dispatch = useAppDispatch()
    const headBounds = props.lifeline.placement.headBounds;
    return (
        <Group>
            <Rect
                fill={"cornsilk"}
                stroke={"peru"}
                strokeWidth={1}
                {...headBounds}
                x={headBounds.x}
                shadowColor={'black'}
                shadowBlur={3}
                shadowOffset={{x: 2, y: 2}}
                shadowOpacity={0.4}
                onClick={({evt: {ctrlKey, shiftKey}}) =>
                    dispatch(nodeSelect({id: props.lifeline.id, shiftKey, ctrlKey}))
                }
            >
            </Rect>
            <Text
                {...headBounds}
                fontSize={14}
                align={"center"}
                verticalAlign={"middle"}
                text={props.lifeline.title}
                draggable={false}
                listening={false}
                preventDefault={true}
            />
            <Line
                stroke={'burlywood'}
                strokeWidth={2}
                dash={[5, 3]}

                x={headBounds.x}
                y={headBounds.y}
                points={lifelinePoints(headBounds, props.lifeline.placement.lifelineEnd)}
            />
            {props.lifeline.activations.map((activation) =>
                <Activation
                    key={activation}
                    activationId={activation}
                />
            )
            }
            {props.isSelected && (
                <Scaffold
                    elementId={props.lifeline.id}
                    bounds={{
                        ...headBounds,
                        height: headBounds.y + props.lifeline.placement.lifelineEnd
                    }}
                    isFocused={props.isFocused}
                    isLinking={props.isLinking}
                    onResize={deltaBounds => dispatch(nodeResize({elementId: props.lifeline.id, deltaBounds}))}
                    linkingDrawing={() => <DrawingMessage lifelinePlacement={props.lifeline.placement} /> }
                />
            )}

        </Group>
    )
}
