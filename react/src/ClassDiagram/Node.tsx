import {NodeState} from "./Models";
import React, {RefObject} from "react";
import {Rect, Text} from "react-konva";
import Konva from "konva";
import {Port} from "./Port";
import {Scaffold} from "./Scaffold";

export interface NodeProps {
    isSelected: boolean;
    isFocused: boolean;
    onSelect: (evt: Konva.KonvaEventObject<MouseEvent>) => void;
    onChange: (newState: NodeState) => void;
    node: NodeState;

}

export const Node = (props: NodeProps) => {

    const shapeRef: RefObject<Konva.Rect> = React.useRef(null);
    // const trRef: RefObject<Scaffold> = React.useRef(null);

    // React.useEffect(() => {
    //     if (props.isSelected) {
    //         // we need to attach transformer manually
    //         // @ts-ignore
    //         trRef.current.nodes([shapeRef.current]);
    //         // @ts-ignore
    //         trRef.current.getLayer().batchDraw();
    //     }
    // }, [props.isSelected]);

    return (
        <React.Fragment>
            <Rect
                onClick={props.onSelect}
                ref={shapeRef}
                fill={"cornsilk"}
                stroke={"burlywood"}
                {...props.node}
                cornerRadius={10}
                cursor={"crosshair"}
                //draggable
                onDragEnd={(e) => {
                    props.onChange({...props.node, x: e.target.x(), y: e.target.y()});
                }}
                onTransformEnd={() => {
                    // transformer is changing scale of the node
                    // and NOT its width or height
                    // but in the store we have only width and height
                    // to match the data better we will reset scale on transform end
                    const n = shapeRef.current!;
                    const scaleX = n.scaleX();
                    const scaleY = n.scaleY();

                    // we will reset it back
                    n.scaleX(1);
                    n.scaleY(1);
                    props.onChange({
                        ...props.node,
                        x: n.x(),
                        y: n.y(),
                        // set minimal value
                        width: Math.max(5, n.width() * scaleX),
                        height: Math.max(n.height() * scaleY),
                    });
                }}>
            </Rect>
            {props.isSelected && (
                <Scaffold
                    bounds={props.node}
                    // ref={trRef}
                    isFocused={props.isFocused}
/*                    boundBoxFunc={(oldBox, newBox) => {
                        // limit resize
                        if (newBox.width < 5 || newBox.height < 5) {
                            return oldBox;
                        }
                        return newBox;
                    }}*/
                />
            )}
            <Text
                x={props.node.x}
                y={props.node.y}
                fontSize={14}
                width={props.node.width}
                height={props.node.height}
                align={"center"}
                verticalAlign={"middle"}
                text={"Hello"}
                draggable={false}
                listening={false}
                preventDefault={true}
            />
            {props.node.ports.map((port, index) =>
                <Port
                    key={index}
                    port={port}
                    node={props.node}
                />
            )}

        </React.Fragment>)
};
