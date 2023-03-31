import {NodeId} from "../features/classDiagram/classDiagramModel";

export type Id = string;
export enum ElementType {
    Unexpected,
    ClassNode,
    ClassDiagram,
    ClassLink,
    ClassPort,
    SequenceDiagram,
    SequenceLifeLine,
    SequenceMessage,
    SequenceActivation,
}

export interface ElementRef {
    id: Id;
    type: ElementType
}

export interface ShapeStyle {
    strokeColor: string;
    fillColor: string;
}

export interface DiagramElement extends ElementRef {
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
    nodeId: NodeId
    links: Id[]
}

export interface NodeState extends DiagramElement {
    text: string;
    shapeStyle: ShapeStyle
    ports: Id[];
}

export interface LinkState extends DiagramElement {
    port1: Id;
    port2: Id;
}


export const defaultShapeStyle: ShapeStyle = {
    strokeColor: "burlywood", // "peru"
    fillColor: "cornsilk"
}

const pinkShapeStyle: ShapeStyle = {
    strokeColor: "lightcoral",
    fillColor: "mistyrose"
}

const leafShapeStyle: ShapeStyle = {
    strokeColor: "#9EBD5D",
    fillColor: "#F4F7EC"
}

const steelShapeStyle: ShapeStyle = {
    strokeColor: "#AEBFD1", // darker "lightsteelblue",
    fillColor: "#F0F5FF" // "lightsteelblue" + 20% ligghter
}

export const shapeStyleList: ShapeStyle[] = [
    defaultShapeStyle,
    pinkShapeStyle,
    leafShapeStyle,
    steelShapeStyle
]







