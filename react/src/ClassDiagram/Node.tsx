import styles from './Node.module.scss';
import classNames from 'classnames';
import {NodeState, Port, PortPosition} from "../DiagramContainer/DiagramCanvas";

export const Node = function (node: NodeState) {
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

    return <div data-node-id="20d03193-e747-4c79-9567-119dde522a33"
                className={styles.node}
                style={{top: node.top, left: node.left}}>
        <div className={styles.defaultNode}>
            Hello
            {node.ports.map((port, index) => <div key={index} className={portClasses(port)}/>
            )}
        </div>
    </div>;
};
