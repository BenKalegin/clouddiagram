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

export interface LinkState {
    port1: Port;
    port2: Port;
}

export interface ClassDiagramState {
    Nodes: NodeState[];
    Links: LinkState[];
}

export interface ClassDiagramViewState extends ClassDiagramState {
    elementsById: Map<string, DiagramElement>
}


