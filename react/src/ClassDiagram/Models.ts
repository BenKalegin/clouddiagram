import {DiagramElement} from "../Common/Model";

export interface PortState {
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

export const inflate = (bounds: Bounds, dx: number, dy: number): Bounds => ({
    x: bounds.x - dx,
    y: bounds.y - dy,
    width: bounds.width + dx * 2,
    height: bounds.height + dy * 2
});

export interface NodeState extends DiagramElement, Bounds {
    ports: PortState[];
}

export enum PortPosition {
    Left,
    Right,
    Top,
    Bottom
}

export interface LinkState {
    port1: PortState;
    port2: PortState;
}

export interface ClassDiagramState {
    Nodes: NodeState[];
    Links: LinkState[];
}


export interface OverlayEditor {

}

export interface ClassDiagramViewState extends ClassDiagramState {
    // draggingElement: DiagramElement | null;
    // resizingElement: DiagramElement | null;
    focusedElementId: string | null;
    selectedElementIds: string[];
    overlayEditor: OverlayEditor | null;
    elementsById: Map<string, DiagramElement>
}


