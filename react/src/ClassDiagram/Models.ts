import {DiagramElement} from "../Common/Model";

export interface Port {
    position: PortPosition;
}

export interface Coordinate {
    top: number;
    left: number;
}

export const ZeroCoordinate : Coordinate = {left: 0, top: 0};

export interface NodeState extends DiagramElement, Coordinate {
    ports: Port[];
}

export enum PortPosition {
    Left,
    Right,
    Top,
    Bottom
}

