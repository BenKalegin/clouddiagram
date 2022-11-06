import {DiagramElement} from "../Common/Model";

export interface Marker {
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

export enum PortAlignment {
    Left,
    Right,
    Top,
    Bottom,
}

export interface PortState extends DiagramElement {
    alignment: PortAlignment;
    /**
     * Percentage of edge wide where the port center is located, counting from left or top
     * For example, 50 for the top oriented is the center of the top edge
     */
    edgePosRatio: number

    /**
     * Percentage of the port going deep inside the node.
     * - 0 means the port is on the edge of the node pointing outward
     * - 50 means the half of port crosses the edge
     * - 100 means the port is sunk into the node
     */
    depthRatio: number

    /**
     * Width of the marker along the edge it belong to
     */
    latitude: number;

    /**
     * Height of the marker in perpendicular direction to the edge it belong to
     */
    longitude: number;
}


export interface NodeState extends DiagramElement, Bounds {
    ports: PortState[];
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


export interface LinkViewState extends LinkState {

}

export interface ClassDiagramViewState extends ClassDiagramState {
    // draggingElement: DiagramElement | null;
    // resizingElement: DiagramElement | null;
    focusedElementId: string | null;
    selectedElementIds: string[];
    overlayEditor: OverlayEditor | null;
    elementsById: Map<string, DiagramElement>
}


