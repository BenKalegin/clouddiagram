import {Bounds} from "./Models";
import React, {RefObject} from "react";
import {Rect, Text} from "react-konva";
import Konva from "konva";
import {Port} from "./Port";
import {Scaffold} from "./Scaffold";
import {nodeResize, NodeState, PortAlignment, PortState} from "./classDiagramSlice";
import {useAppDispatch, useAppSelector} from "../../app/hooks";

export interface NodeProps {
     isSelected: boolean;
     isFocused: boolean;
     onSelect: (evt: Konva.KonvaEventObject<MouseEvent>) => void;
     // onChange: (newState: NodeState) => void;
     node: NodeState;

}

export const Node = (props: NodeProps) => {

    // const count = useAppSelector(state => state.diagram);
    const dispatch = useAppDispatch();
    //const shapeRef: RefObject<Konva.Rect> = React.useRef(null);
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

        const node: Bounds = props.node.placement;
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

    return (
        <React.Fragment>
            <Rect
                // onClick={props.onSelect}
                //ref={shapeRef}
                fill={"cornsilk"}
                stroke={"burlywood"}
                {...props.node.placement}
                cornerRadius={10}
                cursor={"crosshair"}
                //draggable
                onDragEnd={(e) => {
                    const deltaBounds = {x: e.target.x(), y: e.target.y(), width: 0, height: 0};
                    // dispatch(nodeResize({ node: props.node, deltaBounds} ))
                }}
            />
            {props.isSelected && (
                <Scaffold
                    bounds={props.node.placement}
                    isFocused={props.isFocused}
                    onResize={deltaBounds => {
                        // dispatch(nodeResize({ node: props.node, deltaBounds} ))
                    }
                 }
                />
            )}
            <Text
                {...props.node.placement}
                fontSize={14}
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

        </React.Fragment>
    );
}
