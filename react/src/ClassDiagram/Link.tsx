import styles from './Link.module.scss';
import {LinkState, NodeState} from "../DiagramContainer/DiagramCanvas";

export const Link = function (link: LinkState)
{
    return <g className={styles.link}>
        <path d="M 154 107 C 269 107, 166 340, 281 340" strokeWidth="2" fill="none" stroke="black"/>
    </g>
}