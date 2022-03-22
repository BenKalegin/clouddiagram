import styles from './Node.module.scss';


export const Node = () =>
    <div data-node-id="20d03193-e747-4c79-9567-119dde522a33"
         className={styles.node}
         style={{top: 50, left: 50}}>
        <div className={styles.defaultNode}>
            Hello
            <div className={styles.port_bottom} data-port-id="72f55820-671a-4142-bb1d-523af53639af"/>
            <div className="port top  default" data-port-id="4b066b74-53a8-4bb8-b077-a135cf3cd346"/>
            <div className="port left  default" data-port-id="c04cefc3-a148-4566-9fa9-022c8c89d402"/>
            <div className="port right has-links default" data-port-id="1e57e6aa-f6ea-4514-ba5d-88ee6c37c125"/>
        </div>
    </div>;
