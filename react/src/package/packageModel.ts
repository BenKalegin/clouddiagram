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
    Note,
}

export interface ElementRef {
    id: Id;
    type: ElementType
}

export interface ShapeStyle {
    strokeColor: string;
    fillColor: string;
}

export interface LineStyle {
    strokeColor: string;
    fillColor: string;
    width: number;
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


const khakiStrokeColor = "burlywood";
const khakiFillColor = "cornsilk";

const pinkStrokeColor = "lightcoral";
const pinkFillColor = "mistyrose";

const leafStrokeColor = "#9EBD5D";
const leafFillColor = "#F4F7EC";

const steelStrokeColor = "#AEBFD1"; // darker "lightsteelblue",
const steelFillColor = "#F0F5FF"; // "lightsteelblue" + 20% ligghter

export const defaultShapeStyle: ShapeStyle = {
    strokeColor: khakiStrokeColor, // "peru"
    fillColor: khakiFillColor
}

const pinkShapeStyle: ShapeStyle = {
    strokeColor: pinkStrokeColor,
    fillColor: pinkFillColor
}

const leafShapeStyle: ShapeStyle = {
    strokeColor: leafStrokeColor,
    fillColor: leafFillColor
}

const steelShapeStyle: ShapeStyle = {
    strokeColor: steelStrokeColor,
    fillColor: steelFillColor
}

export const shapeStyleList: ShapeStyle[] = [
    defaultShapeStyle,
    pinkShapeStyle,
    leafShapeStyle,
    steelShapeStyle
]

export const defaultLineStyle: LineStyle = {
    width: 2,
    strokeColor: khakiStrokeColor,
    fillColor: khakiStrokeColor
}

const pinkLineStyle: LineStyle = {
    width: 2,
    strokeColor: pinkStrokeColor,
    fillColor: pinkStrokeColor
}

const leafLineStyle: LineStyle = {
    width: 2,
    strokeColor: leafStrokeColor,
    fillColor: leafStrokeColor
}

const steelLineStyle: LineStyle = {
    width: 2,
    strokeColor: steelStrokeColor,
    fillColor: steelStrokeColor
}

export const lineStyleList: LineStyle[] = [
    defaultLineStyle,
    pinkLineStyle,
    leafLineStyle,
    steelLineStyle
]






