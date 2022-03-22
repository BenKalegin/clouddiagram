import styles from './DiagramCanvas.module.scss';
import {Node} from "../ClassDiagram/Node";


export const DiagramCanvas = () =>
    <div className={styles.canvas}>
        <svg className={styles.svgLayer} transform={"translate(0px, 0px)"} scale="1"/>
        <div className={styles.htmlLayer}>
            <Node/>
        </div>
    </div>;
;