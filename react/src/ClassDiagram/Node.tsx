import {Bounds, Coordinate, NodeState, Port, PortPosition} from "./Models";
import React, {RefObject} from "react";
import {Circle, Group, Label, Rect, Text, Transformer} from "react-konva";
import Konva from "konva";

export interface NodeProps {
    isSelected: boolean;
    onSelect: (evt: Konva.KonvaEventObject<MouseEvent>) => void;
    onChange: (newState: NodeState) => void;
    node: NodeState;

}

export const Node = (props: NodeProps) => {

    const portPos = (port: Port): Coordinate => {
        const node: Bounds = props.node;
        switch (port.position) {
            case PortPosition.Top:
                return {
                    x: node.x + node.width / 2,
                    y: node.y
                }
            case PortPosition.Bottom:
                return {
                    x: node.x + node.width / 2,
                    y: node.y + node.height
                }
            case PortPosition.Left:
                return {
                    x: node.x,
                    y: node.y + node.height / 2
                }
            case PortPosition.Right:
                return {
                    x: node.x + node.width,
                    y: node.y + node.height / 2
                };
        }
    };

    const shapeRef: RefObject<Konva.Rect> = React.useRef(null);
    const trRef: RefObject<Konva.Transformer> = React.useRef(null);

    React.useEffect(() => {
        if (props.isSelected) {
            // we need to attach transformer manually
            // @ts-ignore
            trRef.current.nodes([shapeRef.current]);
            // @ts-ignore
            trRef.current.getLayer().batchDraw();
        }
    }, [props.isSelected]);

    console.log("Node: " + props.node.id + " selected " + props.isSelected);

    return (
        <React.Fragment>
                <Rect
                    onClick={props.onSelect}
                    ref={shapeRef}
                    fill={"red"}
                    {...props.node}
                    cornerRadius={10}
                    draggable
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
                    <Transformer
                        ref={trRef}
                        boundBoxFunc={(oldBox, newBox) => {
                            // limit resize
                            if (newBox.width < 5 || newBox.height < 5) {
                                return oldBox;
                            }
                            return newBox;
                        }}
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
                    // https://stackoverflow.com/questions/49692354/is-there-a-way-to-define-text-inside-a-konva-rect-class-by-using-only-konva-rect
                    // Use Konva.Label
                    // Create a draggable group with rectangle and text inside
                    // Create one custom shape. Draw rectangle and text inside sceneFunc
                />
                {props.node.ports.map((port, index) =>
                    <Circle
                        {...portPos(port)}
                        radius={5}
                        fill={"green"}
                        key={index}
                    />)}

        </React.Fragment>)
};
