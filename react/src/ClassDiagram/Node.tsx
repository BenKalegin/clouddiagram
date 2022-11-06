import {Bounds, NodeState, PortAlignment, PortState} from "./Models";
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

    const portBounds = (port: PortState): Bounds => {

        const node: Bounds = props.node;
        switch (port.alignment) {
            case PortAlignment.Top:
                return {
                    x: node.x + node.width * port.edgePosRatio / 100 - port.latitude / 2,
                    y: node.y - port.longitude * (100 - port.depthRatio) / 100,
                    width: port.latitude,
                    height: port.longitude
                }
            case PortAlignment.Bottom:
                return {
                    x: node.x + node.width * port.edgePosRatio / 100 - port.latitude / 2,
                    y: node.y + node.height - port.longitude * port.depthRatio / 100,
                    width: port.latitude,
                    height: port.longitude
                }
            case PortAlignment.Left:
                return {
                    x: node.x - port.longitude * (100 - port.depthRatio) / 100,
                    y: node.y + node.height * port.edgePosRatio / 100 - port.latitude / 2,
                    width: port.latitude,
                    height: port.longitude
                }
            case PortAlignment.Right:
                return {
                    x: node.x + node.width - port.longitude * port.depthRatio / 100,
                    y: node.y + node.height * port.edgePosRatio / 100 - port.latitude / 2,
                    width: port.latitude,
                    height: port.longitude
                };
            default:
                throw new Error("Unknown port alignment:" + port.alignment);
        }
    }

    function updateStateAfterResize(deltaBounds: Bounds) {
        const node = {...props.node}

        node.x = props.node.x + deltaBounds.x
        node.y = props.node.y + deltaBounds.y
        // set minimal value
        node.width = Math.max(5, props.node.width + deltaBounds.width)
        node.height = Math.max(5, props.node.height + deltaBounds.height)
        return node;
    }

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
                    onResize={deltaBounds => {
                        props.onChange(updateStateAfterResize(deltaBounds))
                    }
                 }
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
                    bounds={portBounds(port)}
                />
            )}

        </React.Fragment>)
};
