import { PredefinedSvg } from "../features/graphics/graphicsReader";
import { NodeId } from "../features/structureDiagram/structureDiagramState";
export type Id = string;
export declare enum ElementType {
    Unexpected = 0,
    ClassNode = 1,
    ClassDiagram = 2,
    ClassLink = 3,
    ClassPort = 4,
    SequenceDiagram = 5,
    SequenceLifeLine = 6,
    SequenceMessage = 7,
    SequenceActivation = 8,
    Note = 9,
    DeploymentDiagram = 10,
    DeploymentNode = 11,
    DeploymentLink = 12,
    FlowchartDiagram = 13
}
export interface ElementRef {
    id: Id;
    type: ElementType;
}
export interface ColorSchema {
    strokeColor: string;
    fillColor: string;
    textColor?: string;
}
export interface LineStyle {
    strokeColor: string;
    fillColor: string;
    width: number;
}
export declare enum PictureLayout {
    NoIconRect = 0,
    TopLeftCorner = 1,
    FullIconTextBelow = 2,
    Center = 3
}
export interface CustomShape {
    pictureId: PredefinedSvg;
    layout: PictureLayout;
}
export interface DiagramElement extends ElementRef {
    customShape?: CustomShape;
}
export interface Package {
    elements: {
        [id: Id]: DiagramElement;
    };
}
export declare enum PortAlignment {
    Left = 0,
    Right = 1,
    Top = 2,
    Bottom = 3
}
export interface PortState extends DiagramElement {
    /**
     * Percentage of the port going deep inside the node.
     * - 0 means the port is on the edge of the node pointing outward
     * - 50 means the half of port crosses the edge
     * - 100 means the port is sunk into the node
     */
    depthRatio: number;
    /**
     * Width of the marker along the edge it belong to
     */
    latitude: number;
    /**
     * Height of the marker in perpendicular direction to the edge it belong to
     */
    longitude: number;
    nodeId: NodeId;
    links: Id[];
}
export interface HasColorSchema {
    colorSchema: ColorSchema;
}
export interface NodeState extends DiagramElement, HasColorSchema {
    text: string;
    ports: Id[];
    flowchartKind?: FlowchartNodeKind;
}
export declare enum FlowchartNodeKind {
    Process = "process",
    Decision = "decision",
    Terminator = "terminator",
    InputOutput = "input-output",
    C4Person = "c4-person",
    C4System = "c4-system",
    C4Container = "c4-container",
    C4Component = "c4-component"
}
export declare enum RouteStyle {
    /**
     * A straight line drawn directly from the source element to the target element.
     * No intermediate waypoints are added automatically; it’s the simplest style.
     */
    Direct = "direct",
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
    OrthogonalRounded = "orthogonalRounded"
}
export declare enum TipStyle {
    None = "none",
    Arrow = "arrow",
    Triangle = "triangle",
    Diamond = "diamond",
    Circle = "circle",
    Square = "square"
}
export declare const defaultRouteStyle: RouteStyle;
export declare enum CornerStyle {
    Straight = "straight"
}
export declare const defaultCornerStyle: CornerStyle;
export declare const defaultNoteStyle: ColorSchema;
export declare const defaultNoteWidth = 120;
export declare const defaultNoteHeight = 70;
export declare const lineStyleList: LineStyle[];
export declare const defaultLineStyle: LineStyle;
export interface LinkState extends DiagramElement, HasColorSchema {
    port1: Id;
    port2: Id;
    text?: string;
    tipStyle1: TipStyle;
    tipStyle2: TipStyle;
    routeStyle: RouteStyle;
    cornerStyle: CornerStyle;
}
//# sourceMappingURL=packageModel.d.ts.map