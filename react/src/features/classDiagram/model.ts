import {Bounds, Coordinate, DiagramElement, DiagramState, Id} from "../../common/Model";
import {PathGenerators} from "../../common/Geometry/PathGenerator";
import {WritableDraft} from "immer/dist/internal";
import {current} from "@reduxjs/toolkit";
import {generateId} from "./diagramEditorSlice";

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

export interface ClassDiagramState extends DiagramState {
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

export const linkPlacement = (sourcePort: PortState, targetPort: PortState): LinkPlacement => {

    return {
        // svgPath: PathGenerators.Smooth(link, [p1, p2], p1, p2).path
        svgPath: PathGenerators.Straight([], sourcePort, targetPort).path
    };
}

export const nodePlacementAfterResize = ({placement}: NodeState, deltaBounds: Bounds): Bounds => {
    return {
        x: placement.x + deltaBounds.x,
        y: placement.y + deltaBounds.y,
        // set minimal value
        width: Math.max(5, placement.width + deltaBounds.width),
        height: Math.max(5, placement.height + deltaBounds.height)
    }
}

export function resizeNode(diagram: WritableDraft<ClassDiagramState>, deltaBounds: Bounds, elementId: Id) {
    const node = diagram.nodes[elementId];

    const nodePlacement = nodePlacementAfterResize(node, deltaBounds);
    node.placement = nodePlacement;

    const portAffected = node.ports.map(port => diagram.ports[port]);
    const portPlacements: { [id: Id]: Bounds } = {};

    portAffected.forEach(port => {
        const bounds = portBounds(nodePlacement, port);
        portPlacements[port.id] = bounds;
        port.placement = bounds;
    });

    const links: { [id: Id]: LinkState } = current(diagram.links);
    for (let link of Object.values(links)) {
        const bounds1 = portPlacements[link.port1];
        const bounds2 = portPlacements[link.port2];
        if (bounds1 || bounds2) {
            diagram.links[link.id].placement = linkPlacement(
                diagram.ports[link.port1],
                diagram.ports[link.port2]);
        }
    }
}

export function addNewElementAt(diagram: WritableDraft<ClassDiagramState>, id: string, droppedAt: Coordinate, name: string) {
    const defaultWidth = 100;
    const defaultHeight = 80;

    const result = {
        id,
        text: name,
        ports: [],
        placement: {
            x: droppedAt.x - defaultWidth / 2,
            y: droppedAt.y,
            width: defaultWidth,
            height: defaultHeight
        }
    };
    diagram.nodes[id] = result
    return result;
}


export function autoConnect(diagram: WritableDraft<ClassDiagramState>, sourceId: Id, targetId: Id) {
    const source = diagram.nodes[sourceId];
    const target = diagram.nodes[targetId];

    function addNewPort(node: WritableDraft<NodeState>, alignment: PortAlignment) {
        const result: PortState = {
            id: generateId(),
            edgePosRatio: 50,
            alignment: alignment,
            depthRatio: 50,
            latitude: 8,
            longitude: 8,
            placement: {} as Bounds,
        }
        result.placement = nodePlacementAfterResize(node, portBounds(node.placement, result));
        node.ports.push(result.id);
        diagram.ports[result.id] = result;
        return result
    }

    const sourcePort = addNewPort(source, PortAlignment.Right);

    const targetPort = addNewPort(target, PortAlignment.Left);

    const linkId = "link-" + sourceId + "-" + targetId;
    diagram.links[linkId] = {
        id: linkId,
        port1: sourcePort.id,
        port2: targetPort.id,
        placement: linkPlacement(sourcePort, targetPort)
    }
}
