import styles from './Node.module.scss';
import classNames from 'classnames';

interface INodeProps {
    top: number;
    left: number;
}

export const Node = (props: INodeProps) =>
    <div data-node-id="20d03193-e747-4c79-9567-119dde522a33"
         className={styles.node}
         style={{top: props.top, left: props.left}}>
        <div className={styles.defaultNode}>
            Hello
            <div className={classNames(styles.port, styles.bottom)} data-port-id="72f55820-671a-4142-bb1d-523af53639af"/>
            <div className={classNames(styles.port, styles.top)} data-port-id="4b066b74-53a8-4bb8-b077-a135cf3cd346"/>
            <div className={classNames(styles.port, styles.left)}  data-port-id="c04cefc3-a148-4566-9fa9-022c8c89d402"/>
            <div className={classNames(styles.port, styles.right)} data-port-id="1e57e6aa-f6ea-4514-ba5d-88ee6c37c125"/>
        </div>
    </div>;
