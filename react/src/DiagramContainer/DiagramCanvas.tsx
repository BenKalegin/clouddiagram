import styles from './DiagramCanvas.module.scss';
import {Node} from "../ClassDiagram/Node";
import {useState} from "react";

export enum PortPosition {
    Left,
    Right,
    Top,
    Bottom
};

export interface Port {
    position: PortPosition;
}

export interface NodeState {
    top: number;
    left: number;
    ports: Port[];
}

interface ClassDiagramState {
    Nodes: NodeState[];
}

function getDefaultDiagramState() {
    const node1: NodeState = {
        ports: [
            { position: PortPosition.Left },
            { position: PortPosition.Right },
            { position: PortPosition.Top },
            { position: PortPosition.Bottom }
        ],
        top: 50,
        left: 50
    };

    const node2: NodeState = {
        ports: [
            { position: PortPosition.Left },
            { position: PortPosition.Right },
            { position: PortPosition.Top },
            { position: PortPosition.Bottom }
        ],
        top: 300,
        left: 300
    };

    const diagram: ClassDiagramState = {
        Nodes: [node1, node2]
    }
    return diagram;
}

const defaultDiagramState = getDefaultDiagramState();

export const DiagramCanvas = function () {
    const [diagram, setDiagram] = useState(defaultDiagramState);

    return <div className={styles.canvas}>
        <svg className={styles.svgLayer} scale="1"/>
        <div className={styles.htmlLayer}>
            {diagram.Nodes.map((node, index) => {
                return <Node key={index} {...node} />
            })}
        </div>
    </div>;
};
