import {Group, Line, Rect, Text} from "react-konva";
import {LifelineState} from "./model";
import React from "react";
import {Scaffold} from "../classDiagram/Scaffold";
import {nodeResize, nodeSelect} from "../classDiagram/diagramEditorSlice";
import {useAppDispatch} from "../../app/hooks";

export interface LifelineProps {
    isSelected: boolean;
    isFocused: boolean;
    lifeline: LifelineState;
}

const activationWidth = 10;

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
                points={[
                    headBounds.width/2,
                    headBounds.height + 2 /* shadow*/,
                    headBounds.width/2,
                    headBounds.y + props.lifeline.placement.lifelineEnd
                ]}
            />
            {props.lifeline.activations.map((activation, index) =>
                <Rect
                    key={index}
                    fill={"cornsilk"}
                    stroke={"peru"}
                    strokeWidth={1}
                    x={headBounds.x + headBounds.width/2 - activationWidth/2}
                    y={headBounds.y + headBounds.height + activation.start}
                    width={activationWidth}
                    height={activation.length}
                >
                </Rect>)
            }
            {props.isSelected && (
                <Scaffold
                    bounds={{
                        ...headBounds,
                        height: headBounds.y + props.lifeline.placement.lifelineEnd
                    }}
                    isFocused={props.isFocused}
                    onResize={deltaBounds => dispatch(nodeResize({elementId: props.lifeline.id, deltaBounds}))}
                />
            )}

        </Group>
    )
}
