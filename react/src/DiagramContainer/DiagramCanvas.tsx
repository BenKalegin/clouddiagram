import styles from './DiagramCanvas.module.scss';
import {Node} from "../ClassDiagram/Node";
import React, {MouseEventHandler, useState} from "react";
import {Link} from "../ClassDiagram/Link";
import {InteractionDispatch} from "./InteractionDispatch";
import {NodeState, Port, PortPosition} from "../ClassDiagram/Models";
import {DiagramElement} from "../Common/Model";

;

export interface LinkState {
    port1: Port;
    port2: Port;
}

interface ClassDiagramState {
    Nodes: NodeState[];
    Links: LinkState[];
}

interface ClassDiagramViewState extends ClassDiagramState {
    elementsById: Map<string, DiagramElement>
}

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
        top: 50,
        left: 50
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
        top: 300,
        left: 300
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

const defaultDiagramState = getDefaultDiagramViewState();

export function DiagramCanvas() {
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

    return <div className={styles.canvas}
                onMouseDown={(e) => handleMouseDown(e)}
                onMouseUp={(e) => handler.onMouseUp(e)}
                onMouseMove={(e) => handler.onMouseMove(e)}>
        <svg className={styles.svgLayer} scale="1">
            {diagram.Links.map((link, index) => {
                return <Link key={index} {...link} />
            })}
        </svg>
        <div className={styles.htmlLayer}>
            {diagram.Nodes.map((node, index) => {
                return <Node key={index} {...node} />
            })}
        </div>
    </div>;
}
