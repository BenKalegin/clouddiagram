import {Group, Rect, Text} from "react-konva";
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


export const Lifeline = (props: LifelineProps) => {
    const dispatch = useAppDispatch()
    return (
        <Group>
            <Rect
                fill={"cornsilk"}
                stroke={"burlywood"}
                {...props.lifeline.placement.headBounds}
                x={props.lifeline.placement.headBounds.x}
                onClick={({evt: {ctrlKey, shiftKey}}) =>
                    dispatch(nodeSelect({id: props.lifeline.id, shiftKey, ctrlKey}))
                }
            >
            </Rect>
            <Text
                {...props.lifeline.placement.headBounds}
                fontSize={14}
                align={"center"}
                verticalAlign={"middle"}
                text={props.lifeline.title}
                draggable={false}
                listening={false}
                preventDefault={true}
            />
            {props.isSelected && (
                <Scaffold
                    bounds={props.lifeline.placement.outlineBounds}
                    isFocused={props.isFocused}
                    onResize={deltaBounds => dispatch(nodeResize({elementId: props.lifeline.id, deltaBounds}))}
                />
            )}

        </Group>
    )
}
