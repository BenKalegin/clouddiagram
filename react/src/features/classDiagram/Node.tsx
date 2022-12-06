import React from "react";
import {Rect, Text} from "react-konva";
import {Port} from "./Port";
import {Scaffold} from "../scaffold/Scaffold";
import {
    ClassDiagramEditor,
    nodeResize,
    nodeSelect,
    selectDiagramEditor
} from "./diagramEditorSlice";
import {useAppDispatch, useAppSelector} from "../../app/hooks";
import {NodeState} from "./model";

export interface NodeProps {
     isSelected: boolean;
     isFocused: boolean;
     isLinking: boolean;
     node: NodeState;
}

export const Node = (props: NodeProps) => {

    const diagram = useAppSelector(state => (selectDiagramEditor(state) as ClassDiagramEditor).diagram);
    //const diagram = useAppSelector(state => selectClassDiagramEditor(state).diagram);
    const dispatch = useAppDispatch();

    return (
        <React.Fragment>
            <Rect
                fill={"cornsilk"}
                stroke={"burlywood"}
                {...props.node.placement}
                cornerRadius={10}
                cursor={"crosshair"}
                //draggable
                onClick={({evt: {ctrlKey, shiftKey}}) =>
                    dispatch(nodeSelect({id: props.node.id, shiftKey, ctrlKey}))
                }
                onDragEnd={(e) => {
                    const deltaBounds = {x: e.target.x(), y: e.target.y(), width: 0, height: 0};
                    dispatch(nodeResize({ elementId: props.node.id, deltaBounds} ))
                }}
            />
            {props.isSelected && (
                <Scaffold
                    bounds={props.node.placement}
                    isFocused={props.isFocused}
                    isLinking={props.isLinking}
                    onResize={deltaBounds => {
                        dispatch(nodeResize({ elementId: props.node.id, deltaBounds} ))
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
