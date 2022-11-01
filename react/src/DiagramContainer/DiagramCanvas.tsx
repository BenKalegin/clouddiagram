import {Node} from "../ClassDiagram/Node";
import React, {useState} from "react";
import {Layer, Stage} from 'react-konva';
import {ClassDiagramState, ClassDiagramViewState, NodeState, PortPosition} from "../ClassDiagram/Models";
import {DiagramElement} from "../Common/Model";
import Konva from "konva";
import {Link} from "../ClassDiagram/Link";
import {getFirstVisibleElementFromSelector} from "@fluentui/react";

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

    return {
        Nodes: [node1, node2],
        Links: [{port1: port1, port2: port2}]
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
                            onChange={(nodeState: NodeState) => {
                                const nodes = diagram.Nodes.slice();
                                nodes[i] = {...nodeState};
                                setDiagram({...diagram, Nodes: nodes})
                            }}
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
