import styles from './DiagramCanvas.module.scss';
import {Node} from "../ClassDiagram/Node";
import {useState} from "react";
import {Link} from "../ClassDiagram/Link";

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

export interface LinkState {
    port1: Port;
    port2: Port;
}

interface ClassDiagramState {
    Nodes: NodeState[];
    Links: LinkState[];
}

function getDefaultDiagramState() {
    let port1 = { position: PortPosition.Right };
    const node1: NodeState = {
        ports: [
            { position: PortPosition.Left },
            port1,
            { position: PortPosition.Top },
            { position: PortPosition.Bottom }
        ],
        top: 50,
        left: 50
    };

    let port2 = { position: PortPosition.Left };

    const node2: NodeState = {
        ports: [
            port2,
            { position: PortPosition.Right },
            { position: PortPosition.Top },
            { position: PortPosition.Bottom }
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

const defaultDiagramState = getDefaultDiagramState();

export const DiagramCanvas = function () {
    const [diagram, setDiagram] = useState(defaultDiagramState);

    return <div className={styles.canvas}>
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
};
