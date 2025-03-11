import {Bounds, Diagram} from "../../common/model";
import {Id, PortAlignment} from "../../package/packageModel";

export type NodePlacement = {
    bounds: Bounds
}

export interface PortPlacement {
    alignment: PortAlignment;
    /**
     * Percentage of edge wide where the port center is located, counting from left or top
     * For example, 50 for the top oriented is the center of the top edge
     */
    edgePosRatio: number
}

export enum CornerStyle {
    Straight = "straight"
}

export enum LinkStyle {
    /**
     * A straight line drawn directly from the source element to the target element.
     * No intermediate waypoints are added automatically; it’s the simplest style.
     */
    Direct  = "direct",

    /**
     * The connector automatically routes itself around elements to avoid overlaps, typically in an orthogonal (right-angle) manner.
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
     * A tree layout displayed horizontally, with parent nodes on the left and child nodes branching out to the right (or vice versa).
     * Useful for organizational or hierarchical diagrams that flow horizontally.
     */
    TreeStyleHorizontal = "treeStyleHorizontal",

    /**
     * A variation on tree-style or hierarchical connections, but specifically oriented vertically.
     * The exact visual layout can depend on how EA interprets the relationship among elements (often used for mind-map style layouts or structured grouping).
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

export const defaultLinkPlacement: LinkPlacement = {
    linkStyle: LinkStyle.Direct,
    cornerStyle: CornerStyle.Straight
}

export interface LinkPlacement {
    linkStyle: LinkStyle;
    cornerStyle: CornerStyle;
}

export interface LinkRender {
    svgPath: string[];
}

export type PortRender = {
    bounds: Bounds
}

export enum ClassDiagramModalDialog {
    nodeProperties = "props"
}

export interface ClassDiagramState extends StructureDiagramState {
    modalDialog: ClassDiagramModalDialog | undefined
}

export type NodeId = Id;
export type PortId = Id;
export type LinkId = Id;


export interface StructureDiagramState extends Diagram {
    nodes: { [id: NodeId]: NodePlacement };
    ports: { [id: PortId]: PortPlacement };
    links: { [id: LinkId]: LinkPlacement };
}
