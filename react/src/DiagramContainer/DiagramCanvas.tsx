import {Node} from "../ClassDiagram/Node";
import React, {useState} from "react";
import {Layer, Stage} from 'react-konva';
import {
    ClassDiagramState,
    ClassDiagramViewState,
    LinkState,
    NodeState,
    PortAlignment,
    PortState
} from "../ClassDiagram/Models";
import {DiagramElement} from "../Common/Model";
import Konva from "konva";
import {Link} from "../ClassDiagram/Link";

function getDefaultDiagramState(): ClassDiagramState {
    const port11: PortState = {
        id: "port1",
        edgePosRatio: 50,
        alignment: PortAlignment.Right,
        depthRatio: 50,
        latitude: 8,
        longitude: 8
    }

    const port12: PortState = {
        id: "port1",
        edgePosRatio: 50,
        alignment: PortAlignment.Top,
        depthRatio: 50,
        latitude: 8,
        longitude: 8
    }

    const port13: PortState = {
        id: "port1",
        edgePosRatio: 50,
        alignment: PortAlignment.Bottom,
        depthRatio: 50,
        latitude: 8,
        longitude: 8
    }

    const node1: NodeState = {
        id: "node1",
        ports: [
            port11,
            port12,
            port13
        ],
        y: 50,
        x: 50,
        width: 100,
        height: 80
    };

    const port2: PortState = {
        id: "port1",
        edgePosRatio: 50,
        alignment: PortAlignment.Left,
        depthRatio: 50,
        latitude: 8,
        longitude: 8
    }

    const node2: NodeState = {
        id: "node2",
        ports: [
            port2,
        ],
        y: 300,
        x: 300,
        width: 100,
        height: 80
    };

    return {
        Nodes: [node1, node2],
        Links: [{port1: port11, port2: port2}]
    };
}


function getDefaultDiagramViewState(): ClassDiagramViewState {
    const diagramState = getDefaultDiagramState();
    return {
        ...diagramState,
        elementsById: new Map<string, DiagramElement>(
            diagramState.Nodes.map(n => [n.id, n])),
        selectedElementIds: [],
        focusedElementId: null,
        overlayEditor: null
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

    const setSelectedIds = (selectedElementIds: string[]) => setDiagram({
        ...diagram,
        selectedElementIds: selectedElementIds,
        focusedElementId: selectedElementIds.length > 0 ? selectedElementIds[selectedElementIds.length-1] : null
    });
    const clearSelection = () => {
        setSelectedIds([])
    };
    const selectId = (id: string, append: boolean) => {
        if (!append) {
            setSelectedIds([id])
        }
        else {
            if (!diagram.selectedElementIds.includes(id)) {
                setSelectedIds([...diagram.selectedElementIds, id])
            }else
                setSelectedIds(diagram.selectedElementIds.filter(e => e !== id))
        }
    };

    const isSelected = (node: NodeState) => diagram.selectedElementIds.includes(node.id);
    const isFocused = (node: NodeState) => diagram.focusedElementId === node.id;


    const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // deselect when clicked on empty area
        const clickedOnEmpty = e.target === e.target.getStage()
        if (clickedOnEmpty) {
            clearSelection()
        }
    }

    function onNodeChange(i: number) {
        return (nodeState: NodeState) => {
            const nodes = diagram.Nodes.slice();
            nodes[i] = {...nodeState};
            setDiagram({...diagram, Nodes: nodes})
        };
    }

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
                            isSelected={isSelected(node)}
                            isFocused={isFocused(node)}
                            onSelect={({evt}) => {
                                selectId(node.id, evt.shiftKey || evt.ctrlKey);
                            }}
                            onChange={onNodeChange(i)}
                            node={node}
                        />
                    );
                })}

                {diagram.Links.map((link, index) => {
                    return <Link key={index} {...link} />
                })}

            </Layer>
        </Stage>
    );
}
