import {DiagramElement} from "../Common/Model";

export interface Port {
    position: PortPosition;
}

export interface NodeState extends DiagramElement {
    top: number;
    left: number;
    ports: Port[];
}

export enum PortPosition {
    Left,
    Right,
    Top,
    Bottom
}