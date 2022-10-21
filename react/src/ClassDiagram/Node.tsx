import styles from './Node.module.scss';
import classNames from 'classnames';
import {NodeState, Port, PortPosition} from "./Models";
import React, {RefObject} from "react";
import {Circle, Rect, Text, Transformer} from "react-konva";
import Konva from "konva";

export interface NodeProps {
    isSelected: boolean;
    onSelect: (evt: Konva.KonvaEventObject<MouseEvent>) => void;
    onChange: (newState: NodeState) => void;
    node: NodeState;

}

export const Node = (props: NodeProps) => {
    const portPositionClass = (pos: PortPosition) => {
        switch (pos) {
            case PortPosition.Top:
                return styles.top;
            case PortPosition.Bottom:
                return styles.bottom;
            case PortPosition.Left:
                return styles.left;
            case PortPosition.Right:
                return styles.right;
        }
    };

    const portClasses = (port: Port) => {
        return classNames(styles.port, portPositionClass(port.position));
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

    console.log( "Node: " + props.node.id +  " selected " + props.isSelected);

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
                }}
            />
            <Text
                x={props.node.x}
                y={props.node.y}
                width={props.node.width}
                height={props.node.height}
                align={"center"}
                verticalAlign={"middle"}
                text={"Hello"}
            />
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
            {props.node.ports.map((port, index) =>
                <Circle
                    x={props.node.x + (port.position === PortPosition.Left ? 0 : props.node.width)}
                    y={props.node.y + (port.position === PortPosition.Top ? 0 : props.node.height)}
                    radius={5}
                    fill={"green"}
                    key={index}
                    {...port}
                    className={portClasses(port)}
                />)}

        </React.Fragment>)
};
