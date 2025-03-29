import {PredefinedSvg} from "../features/graphics/graphicsReader";
import {NodeId} from "../features/structureDiagram/structureDiagramState";

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
    DeploymentDiagram,
    DeploymentNode,
    DeploymentLink,
}

export interface ElementRef {
    id: Id;
    type: ElementType
}

export interface ColorSchema {
    strokeColor: string;
    fillColor: string;
}

// for sequence diagram messages
export interface LineStyle {
    strokeColor: string;
    fillColor: string;
    width: number;
}

export enum PictureLayout {
    NoIconRect,
    TopLeftCorner,
    FullIconTextBelow,
    Center,
}


export interface CustomShape {
    pictureId: PredefinedSvg
    layout: PictureLayout

}

export interface DiagramElement extends ElementRef {
    customShape?: CustomShape
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
export interface HasColorSchema {
    colorSchema: ColorSchema
}

export interface NodeState extends DiagramElement, HasColorSchema {
    text: string;
    ports: Id[];
}

export enum RouteStyle {
    /**
     * A straight line drawn directly from the source element to the target element.
     * No intermediate waypoints are added automatically; it’s the simplest style.
     */
    Direct  = "direct",

    /**
     * The connector automatically routes itself around elements to avoid overlaps,
     * typically in an orthogonal (right-angle) manner.
     * If you move shapes around, the connector re-adjusts to maintain clarity.
     */
    AutoRouting = "autoRouting",

    /**
     * Allows you to manually insert and move waypoints (“bend” points) to customize the path of the connector.
     * You have complete control over each segment, which is useful for very specific routing requirements.
     */
    CustomLine = "customLine",

    /**
     * Draws a smooth, curved line (a Bézier curve) between the two elements.
     * You can typically adjust control points to fine-tune the curve if needed.
     */
    Bezier = "bezier",


    /**
     * Arranges connectors in a vertical, hierarchical layout, similar to a vertical tree diagram.
     * Often used for parent–child relationships in a top-to-bottom structure.
     */
    TreeStyleVertical = "treeStyleVertical",

    /**
     * A tree layout displayed horizontally, with parent nodes on the left and child nodes branching out to the right
     * (or vice versa).
     * Useful for organizational or hierarchical diagrams that flow horizontally.
     */
    TreeStyleHorizontal = "treeStyleHorizontal",

    /**
     * A variation on tree-style or hierarchical connections, but specifically oriented vertically.
     * The exact visual layout can depend on how EA interprets the relationship among elements
     * (often used for mind-map style layouts or structured grouping).
     */
    LateralVertical = "lateralVertical",

    /**
     * Similar to “Lateral – Vertical” but oriented horizontally.
     * Elements connect side by side, which can be handy for horizontally expanding diagrams.
     */
    LateralHorizontal = "lateralHorizontal",

    /**
     * Uses right-angle (90-degree) turns to connect elements with strictly horizontal and vertical segments.
     * Sometimes called “Manhattan” style; corners are sharp right angles.
     */
    OrthogonalSquare = "orthogonalSquare",

    /**
     * Also orthogonal with horizontal/vertical segments, but corners are rounded.
     * Provides a slightly softer look while maintaining the neatness of orthogonal routing.
     */
    OrthogonalRounded = "orthogonalRounded",
}

export enum TipStyle {
    None = "none",
    Arrow = "arrow",
    Triangle = "triangle",
    Diamond = "diamond",
    Circle = "circle",
    Square = "square",
}

export const defaultRouteStyle: RouteStyle = RouteStyle.Direct;

export enum CornerStyle {
    Straight = "straight"
}

export const defaultCornerStyle: CornerStyle = CornerStyle.Straight;

const khakiStrokeColor = "burlywood";
const khakiFillColor = "cornsilk";

const pinkStrokeColor = "lightcoral";
const pinkFillColor = "mistyrose";

const leafStrokeColor = "#9EBD5D";
const leafFillColor = "#F4F7EC";

const steelStrokeColor = "#AEBFD1"; // darker "lightsteelblue",
const steelFillColor = "#F0F5FF"; // "lightsteelblue" + 20% lighter

export const defaultColorSchema: ColorSchema = {
    strokeColor: khakiStrokeColor, // "peru"
    fillColor: khakiFillColor
}

const pinkColorSchema: ColorSchema = {
    strokeColor: pinkStrokeColor,
    fillColor: pinkFillColor
}

const leafColorSchema: ColorSchema = {
    strokeColor: leafStrokeColor,
    fillColor: leafFillColor
}

const steelColorSchema: ColorSchema = {
    strokeColor: steelStrokeColor,
    fillColor: steelFillColor
}

export const defaultNoteStyle: ColorSchema = {
    strokeColor: "black",
    fillColor: "white"
}

export const defaultNoteWidth = 120;
export const defaultNoteHeight = 70;



export const colorSchemaList: ColorSchema[] = [
    defaultColorSchema,
    pinkColorSchema,
    leafColorSchema,
    steelColorSchema
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

export interface LinkState extends DiagramElement, HasColorSchema {
    port1: Id;
    port2: Id;

    tipStyle1: TipStyle;
    tipStyle2: TipStyle;

    RouteStyle: RouteStyle;
    cornerStyle: CornerStyle;
}
