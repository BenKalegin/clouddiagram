import {Bounds, DiagramElement, Id} from "../../common/Model";
import {PathGenerators} from "../../common/Geometry/PathGenerator";

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

    placement: Bounds;
}

export interface NodeState extends DiagramElement {
    placement: Bounds;
    text: string;
    ports: Id[];
}

export interface LinkPlacement {
    svgPath: string[];
}

export interface LinkState extends DiagramElement {
    placement: LinkPlacement;
    port1: Id;
    port2: Id;
}

export interface ClassDiagramState {
    nodes: { [id: Id]: NodeState };
    links: { [id: Id]: LinkState };
    ports: { [id: Id]: PortState };
}

export const portBounds = (nodePlacement: Bounds, port: PortState): Bounds => {

    switch (port.alignment) {
        case PortAlignment.Top:
            return {
                x: nodePlacement.x + nodePlacement.width * port.edgePosRatio / 100 - port.latitude / 2,
                y: nodePlacement.y - port.longitude * (100 - port.depthRatio) / 100,
                width: port.latitude,
                height: port.longitude
            }
        case PortAlignment.Bottom:
            return {
                x: nodePlacement.x + nodePlacement.width * port.edgePosRatio / 100 - port.latitude / 2,
                y: nodePlacement.y + nodePlacement.height - port.longitude * port.depthRatio / 100,
                width: port.latitude,
                height: port.longitude
            }
        case PortAlignment.Left:
            return {
                x: nodePlacement.x - port.longitude * (100 - port.depthRatio) / 100,
                y: nodePlacement.y + nodePlacement.height * port.edgePosRatio / 100 - port.latitude / 2,
                width: port.latitude,
                height: port.longitude
            }
        case PortAlignment.Right:
            return {
                x: nodePlacement.x + nodePlacement.width - port.longitude * port.depthRatio / 100,
                y: nodePlacement.y + nodePlacement.height * port.edgePosRatio / 100 - port.latitude / 2,
                width: port.latitude,
                height: port.longitude
            };
        default:
            throw new Error("Unknown port alignment:" + port.alignment);
    }
}

export const linkPlacement = (link: LinkState, sourcePort: PortState, targetPort: PortState): LinkPlacement => {

    return {
        // svgPath: PathGenerators.Smooth(link, [p1, p2], p1, p2).path
        svgPath: PathGenerators.Straight(link, [], sourcePort, targetPort).path
    };
}

