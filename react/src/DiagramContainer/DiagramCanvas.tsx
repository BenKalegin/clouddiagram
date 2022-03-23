import styles from './DiagramCanvas.module.scss';
import {Node} from "../ClassDiagram/Node";
import {useState} from "react";


interface NodeState {
    top: number;
    left: number;
}

interface ClassDiagramState {
    Nodes: NodeState[];
}

function getDefaultDiagramState() {
    const node1: NodeState = {
        top: 50,
        left: 50
    };

    const node2: NodeState = {
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
        <svg className={styles.svgLayer} transform={"translate(0px, 0px)"} scale="1"/>
        <div className={styles.htmlLayer}>
            {diagram.Nodes.map((node, index) => {
                return <Node key={index} top={node.top} left={node.left}/>
            })}
        </div>
    </div>;
};
