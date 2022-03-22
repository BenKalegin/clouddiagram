import styles from './DiagramContainer.module.scss';
import {DiagramCanvas} from "./DiagramCanvas";

export const DiagramContainer = () =>
    <div className={styles.container}>
        <DiagramCanvas/>
    </div>;