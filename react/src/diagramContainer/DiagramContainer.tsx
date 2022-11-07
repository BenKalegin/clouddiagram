import styles from './DiagramContainer.module.scss';
import {DiagramCanvas} from "../features/classDiagram/DiagramCanvas";

export const DiagramContainer = () =>
    <div className={styles.container}>
        <DiagramCanvas/>
    </div>;
