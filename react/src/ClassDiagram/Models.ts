import {DiagramElement} from "../Common/Model";

export interface Port {
    position: PortPosition;
}

export interface Coordinate {
    y: number;
    x: number;
}

export const ZeroCoordinate : Coordinate = {x: 0, y: 0};

export interface Bounds extends Coordinate {
    width: number;
    height: number;
}

export interface NodeState extends DiagramElement, Bounds {
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


