import React from "react";
import {Rect, Text} from "react-konva";
import {Port} from "./Port";
import {Scaffold} from "../scaffold/Scaffold";
import {
    nodeResize,
    selectClassDiagramEditor,
} from "./classDiagramSlice";
import {useAppDispatch, useAppSelector} from "../../app/hooks";
import {DrawingLink} from "./DrawingLink";
import {NodeState} from "../../package/packageModel";
import {NodePlacement} from "./model";
import {nodeSelect} from "../diagramEditor/diagramEditorSlice";

export interface NodeProps {
     isSelected: boolean;
     isFocused: boolean;
     isLinking: boolean;
     node: NodeState;
     nodePlacement: NodePlacement
}

export const Node = (props: NodeProps) => {

    // TODO optimize for more detailed selector
    const diagram = useAppSelector(state => selectClassDiagramEditor(state).diagram);

    const dispatch = useAppDispatch();

    return (
        <React.Fragment>
            <Rect
                fill={"cornsilk"}
                stroke={"burlywood"}
                {...props.nodePlacement}
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
                    elementId={props.node.id}
                    bounds={props.nodePlacement}
                    isFocused={props.isFocused}
                    isLinking={props.isLinking}
                    onResize={deltaBounds => {
                        dispatch(nodeResize({ elementId: props.node.id, deltaBounds} ))
                    }}
                    linkingDrawing={<DrawingLink nodePlacement={props.nodePlacement}/>}
                />
            )}
            <Text
                {...props.nodePlacement}
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
