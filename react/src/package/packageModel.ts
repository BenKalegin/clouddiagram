export type Id = string;
export enum ElementType {
    ClassNode,
    ClassDiagram,
    ClassLink,
    ClassPort,
    SequenceDiagram,
    SequenceLifeLine,
    SequenceMessage,
    SequenceActivation,
}
export interface DiagramElement {
    id: Id;
    type: ElementType
}

export interface Package {
    elements: { [id: Id]: DiagramElement };
}


export enum PortAlignment {
    Left,
    Right,
    Top,
    Bottom,
}

export interface PortState extends DiagramElement {
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

export interface NodeState extends DiagramElement {
    text: string;
    ports: Id[];
}

export interface LinkState extends DiagramElement {
    port1: Id;
    port2: Id;
}


