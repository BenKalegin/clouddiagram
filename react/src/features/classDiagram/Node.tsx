import React from "react";
import {Rect, Text} from "react-konva";
import {Port} from "./Port";
import {Scaffold} from "./Scaffold";
import {nodeResize, nodeSelect, nodeShowProperties, selectDiagramEditor} from "./diagramEditorSlice";
import {useAppDispatch, useAppSelector} from "../../app/hooks";
import {NodeState} from "./model";

export interface NodeProps {
     isSelected: boolean;
     isFocused: boolean;
     node: NodeState;

}

export const Node = (props: NodeProps) => {

    const diagram = useAppSelector(state => selectDiagramEditor(state).diagram.content);
    const dispatch = useAppDispatch();

    return (
        <React.Fragment>
            <Rect
                onClick={({evt: {ctrlKey, shiftKey}}) =>
                    dispatch(nodeSelect({node: props.node, shiftKey, ctrlKey}))
                }
                onDblClick={() => dispatch(nodeShowProperties(props.node.id))}
                fill={"cornsilk"}
                stroke={"burlywood"}
                {...props.node.placement}
                cornerRadius={10}
                cursor={"crosshair"}
                //draggable
                onDragEnd={(e) => {
                    const deltaBounds = {x: e.target.x(), y: e.target.y(), width: 0, height: 0};
                    dispatch(nodeResize({ node: props.node.id, deltaBounds} ))
                }}
            />
            {props.isSelected && (
                <Scaffold
                    bounds={props.node.placement}
                    isFocused={props.isFocused}
                    onResize={deltaBounds => {
                        dispatch(nodeResize({ node: props.node.id, deltaBounds} ))
                    }
                 }
                />
            )}
            <Text
                {...props.node.placement}
                fontSize={14}
                align={"center"}
                verticalAlign={"middle"}
                text={props.node.text}
                draggable={false}
                listening={false}
                preventDefault={true}
            />
            {props.node.ports.map((port, index) =>
                <Port
                    key={index}
                    port={diagram.ports[port]}
                />
            )}

        </React.Fragment>
    );
}
