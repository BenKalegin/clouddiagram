import styles from './DiagramCanvas.module.scss';
import {Node} from "../ClassDiagram/Node";
import React, {MouseEventHandler, RefObject, useReducer, useState} from "react";
import {Link} from "../ClassDiagram/Link";
import {Stage, Layer, Rect, Transformer} from 'react-konva';
import {InteractionDispatch} from "./InteractionDispatch";
import {ClassDiagramState, ClassDiagramViewState, NodeState, Port, PortPosition} from "../ClassDiagram/Models";
import {DiagramElement} from "../Common/Model";
import {cloudDiagramReducer} from "../ClassDiagram/Reducer";
import Konva from "konva";
interface RectAttrs {
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    id: string;
}

interface RectProps {
    shapeProps: RectAttrs;
    isSelected: boolean;
    onSelect: (evt: Konva.KonvaEventObject<MouseEvent>) => void;
    onChange: (newAttrs: RectAttrs) => void;
}

const Rectangle = (props: RectProps) => {
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

    return (
        <React.Fragment>
            <Rect
                onClick={props.onSelect}
                ref={shapeRef}
                {...props.shapeProps}
                draggable
                onDragEnd={(e) => {
                    props.onChange({
                        ...props.shapeProps,
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={() => {
                    // transformer is changing scale of the node
                    // and NOT its width or height
                    // but in the store we have only width and height
                    // to match the data better we will reset scale on transform end
                    const node = shapeRef.current!;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();

                    // we will reset it back
                    node.scaleX(1);
                    node.scaleY(1);
                    props.onChange({
                        ...props.shapeProps,
                        x: node.x(),
                        y: node.y(),
                        // set minimal value
                        width: Math.max(5, node.width() * scaleX),
                        height: Math.max(node.height() * scaleY),
                    });
                }}
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
        </React.Fragment>
    );
};

function getDefaultDiagramState(): ClassDiagramState {
    let port1 = {position: PortPosition.Right};
    const node1: NodeState = {
        id: "node1",
        ports: [
            {position: PortPosition.Left},
            port1,
            {position: PortPosition.Top},
            {position: PortPosition.Bottom}
        ],
        y: 50,
        x: 50,
        width: 100,
        height: 80
    };

    let port2 = {position: PortPosition.Left};

    const node2: NodeState = {
        id: "node2",
        ports: [
            port2,
            {position: PortPosition.Right},
            {position: PortPosition.Top},
            {position: PortPosition.Bottom}
        ],
        y: 300,
        x: 300,
        width: 100,
        height: 80
    };

    const diagram: ClassDiagramState = {
        Nodes: [node1, node2],
        Links: [{port1: port1, port2: port2}]
    }
    return diagram;
}


function getDefaultDiagramViewState(): ClassDiagramViewState {
    const diagramState = getDefaultDiagramState();
    return {
        ...diagramState,
        elementsById: new Map<string, DiagramElement>(
            diagramState.Nodes.map(n => [n.id, n])
        )
    };
}

export interface InteractionHandler {
    onMouseMove: (element: DiagramElement, x: number, y: number) => void;
    onMouseUp: (element: DiagramElement, x: number, y: number) => void;
    onMouseDown: (element: DiagramElement, x: number, y: number) => void;
}

const defaultDiagramState: ClassDiagramViewState = getDefaultDiagramViewState();

export function DiagramCanvas() {
    // TODO const [diagram, dispatch] = useReducer(cloudDiagramReducer, defaultDiagramState);
    const [diagram, setDiagram] = useState(defaultDiagramState);
    const handler: InteractionHandler = new InteractionDispatch();

    function findElement(target: EventTarget): DiagramElement | undefined {
        const div = target as HTMLDivElement;
        if (div) {
            const dataId = div.getAttribute("data-id");
            if (dataId)
                return diagram.elementsById.get(dataId);
        }
        return undefined;
    }

    function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
        let element = findElement(e.target);
        if (element)
            handler.onMouseDown(element, e.clientX, e.clientY);
    }

    function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        let element = findElement(e.target);
        if (element)
            handler.onMouseMove(element, e.clientX, e.clientY);
    }

    function handleMouseUp(e: React.MouseEvent<HTMLDivElement>) {
        let element = findElement(e.target);
        if (element)
            handler.onMouseUp(element, e.clientX, e.clientY);
    }

    const initialRectangles: RectAttrs[] = [
        {
            x: 10,
            y: 10,
            width: 100,
            height: 100,
            fill: 'red',
            id: 'rect1',
        },
        {
            x: 150,
            y: 150,
            width: 100,
            height: 100,
            fill: 'green',
            id: 'rect2',
        },
    ];


    const [selectedId, setSelectedId] = React.useState<string | null>(null);

    const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // deselect when clicked on empty area
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            setSelectedId(null);
        }
    };

    console.log("selected: " + selectedId);
    return (
        <Stage
            width={window.innerWidth}
            height={window.innerHeight}
            onMouseDown={checkDeselect}
        >
            <Layer>
                {diagram.Nodes.map((node, i) => {
                    return (
                        <Node
                            key={i}
                            // shapeProps={node}
                            isSelected={node.id === selectedId}
                            onSelect={() => {
                                console.log("selecting: " + node.id);
                                setSelectedId(node.id);
                            }}
                            onChange={(nodeState: NodeState) => {
                                console.log("changed: " + nodeState.id);
                                const nodes = diagram.Nodes.slice();
                                nodes[i] = {...nodeState};
                                setDiagram({...diagram, Nodes: nodes})
                            }}
                            node={node}
                        />
                    );
                })}
            </Layer>
        </Stage>
    );


    // return <div className={styles.canvas}
    //             onMouseDown={(e) => handleMouseDown(e)}
    //             onMouseUp={(e) => handleMouseUp(e)}
    //             onMouseMove={(e) => handleMouseMove(e)}>
    //     <svg className={styles.svgLayer} scale="1">
    //         {diagram.Links.map((link, index) => {
    //             return <Link key={index} {...link} />
    //         })}
    //     </svg>
    //     <div className={styles.htmlLayer}>
    //         {diagram.Nodes.map((node, index) => {
    //             return <Node key={index} {...node} />
    //         })}
    //     </div>
    // </div>;
}
