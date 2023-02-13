import {Bounds, Coordinate, Diagram} from "../../common/model";
import {PathGenerators} from "../../common/Geometry/PathGenerator";
import {ElementType, Id, LinkState, NodeState, PortAlignment, PortState} from "../../package/packageModel";
import {selectorFamily} from "recoil";
import {DiagramId, elementsAtom, generateId} from "../diagramEditor/diagramEditorModel";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";
import {DialogOperation, Get, Set} from "../diagramEditor/diagramEditorSlice";

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

export interface LinkPlacement {
    //cornerStyle: CornerStyle;
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
export interface ClassDiagramState extends Diagram {
    nodes: { [id: NodeId]: NodePlacement };
    ports: { [id: PortId]: PortPlacement };
    links: { [id: LinkId]: LinkPlacement };
    modalDialog: ClassDiagramModalDialog | undefined
}

export type NodeId = Id;
export type PortId = Id;
export type LinkId = Id;


const renderPort = (nodePlacement: Bounds, port: PortState, portPlacement: PortPlacement): PortRender => {
    return {
        bounds: portBounds(nodePlacement, port, portPlacement)
    }
}
export const portBounds = (nodePlacement: Bounds, port: PortState, portPlacement: PortPlacement): Bounds => {

    switch (portPlacement.alignment) {
        case PortAlignment.Top:
            return {
                x: nodePlacement.x + nodePlacement.width * portPlacement.edgePosRatio / 100 - port.latitude / 2,
                y: nodePlacement.y - port.longitude * (100 - port.depthRatio) / 100,
                width: port.latitude,
                height: port.longitude
            }

        case PortAlignment.Bottom:
            return {
                x: nodePlacement.x + nodePlacement.width * portPlacement.edgePosRatio / 100 - port.latitude / 2,
                y: nodePlacement.y + nodePlacement.height - port.longitude * port.depthRatio / 100,
                width: port.latitude,
                height: port.longitude
            }
        case PortAlignment.Left:
            return {
                x: nodePlacement.x - port.longitude * (100 - port.depthRatio) / 100,
                y: nodePlacement.y + nodePlacement.height * portPlacement.edgePosRatio / 100 - port.latitude / 2,
                width: port.latitude,
                height: port.longitude
            }
        case PortAlignment.Right:
            return {
                x: nodePlacement.x + nodePlacement.width - port.longitude * port.depthRatio / 100,
                y: nodePlacement.y + nodePlacement.height * portPlacement.edgePosRatio / 100 - port.latitude / 2,
                width: port.latitude,
                height: port.longitude
            };
        default:
            throw new Error("Unknown port alignment:" + portPlacement.alignment);
    }
}

export const classDiagramSelector = selectorFamily<ClassDiagramState, DiagramId>({
    key: 'classDiagram',
    get: (id) => ({get}) => {
        return get(elementsAtom(id)) as ClassDiagramState;
    },
    set: (id) => ({set}, newValue) => {
        set(elementsAtom(id), newValue);
    }
})

export const nodeSelector = selectorFamily<NodeState, NodeId>({
    key: 'node',
    get: (nodeId) => ({get}) => {
        return get(elementsAtom(nodeId)) as NodeState;
    },
    set: (nodeId) => ({set}, newValue) => {
        set(elementsAtom(nodeId), newValue);
    }
})

export const nodePlacementSelector = selectorFamily<NodePlacement, { nodeId: NodeId, diagramId: DiagramId }>({
    key: 'nodePlacement',
    get: ({nodeId, diagramId}) => ({get}) => {
        const diagram = get(classDiagramSelector(diagramId));
        return diagram.nodes[nodeId];
    }
})

export const portSelector = selectorFamily<PortState, PortId>({
    key: 'port',
    get: (portId) => ({get}) => {
        return get(elementsAtom(portId)) as PortState;
    }
})

export const portPlacementSelector = selectorFamily<PortPlacement, { portId: Id, diagramId: Id }>({
    key: 'portPlacement',
    get: ({portId, diagramId}) => ({get}) => {
        const diagram = get(classDiagramSelector(diagramId));
        return diagram.ports[portId];
    }
})

export const portRenderSelector = selectorFamily<PortRender, { portId: Id, nodeId: Id, diagramId: Id }>({
    key: 'portRender',
    get: ({portId, nodeId, diagramId}) => ({get}) => {
        const nodePlacement = get(nodePlacementSelector({nodeId, diagramId}));
        const port = get(portSelector(portId));
        const portPlacement = get(portPlacementSelector({portId, diagramId}));
        return renderPort(nodePlacement.bounds, port, portPlacement);
    }
})


export const renderLink = (sourcePort: PortState, sourceBounds: Bounds, sourcePlacement: PortPlacement,
                           targetPort: PortState, targetBounds: Bounds, targetPlacement: PortPlacement): LinkRender => {

    return {
        // svgPath: PathGenerators.Smooth(link, [p1, p2], p1, p2).path
        svgPath: PathGenerators.Straight([], sourcePort, sourceBounds, sourcePlacement, targetPort, targetBounds, targetPlacement).path
    };
}

export const linkRenderSelector = selectorFamily<LinkRender, { linkId: LinkId, diagramId: DiagramId }>({
    key: 'linkPlacement',
    get: ({linkId, diagramId}) => ({get}) => {
        const link = get(elementsAtom(linkId)) as LinkState;
        const port1 = get(portSelector(link.port1));
        const port2 = get(portSelector(link.port2));
        const sourceRender = get(portRenderSelector({portId: link.port1, nodeId: port1.nodeId, diagramId}));
        const targetRender = get(portRenderSelector({portId: link.port2, nodeId: port2.nodeId, diagramId}));
        const sourcePlacement = get(portPlacementSelector({portId: link.port1, diagramId}));
        const targetPlacement = get(portPlacementSelector({portId: link.port2, diagramId}));
        return renderLink(port1, sourceRender.bounds, sourcePlacement, port2, targetRender.bounds, targetPlacement);
    }
})

export function addNewElementAt(get: Get, set: Set, droppedAt: Coordinate, name: string) {

    const defaultWidth = 100;
    const defaultHeight = 80;
    const diagramId = get(activeDiagramIdAtom);
    const node: NodeState = {
        type: ElementType.ClassNode,
        id: generateId(),
        text: name,
        ports: []
    };

    const placement: NodePlacement = {
        bounds: {
            x: droppedAt.x - defaultWidth / 2,
            y: droppedAt.y,
            width: defaultWidth,
            height: defaultHeight
        }
    }

    set(elementsAtom(node.id), node)
    const diagram = get(elementsAtom(diagramId)) as ClassDiagramState;
    const updatedDiagram = {...diagram, nodes: {...diagram.nodes, [node.id]: placement}};
    set(elementsAtom(diagramId), updatedDiagram)
}

export function moveElement(get: Get, set: Set, nodeId: Id, currentPointerPos: Coordinate, startPointerPos: Coordinate, startNodePos: Coordinate) {
    const diagramId = get(activeDiagramIdAtom);
    const diagram = get(elementsAtom(diagramId)) as ClassDiagramState;
    const nodePlacement = diagram.nodes[nodeId];
    const updatedNodePlacement = {
        ...nodePlacement,
        bounds: {
            ...nodePlacement.bounds,
            x: startNodePos.x + currentPointerPos.x - startPointerPos.x,
            y: startNodePos.y + currentPointerPos.y - startPointerPos.y
        }
    }
    const updatedDiagram = {...diagram, nodes: {...diagram.nodes, [nodeId]: updatedNodePlacement}};
    set(elementsAtom(diagramId), updatedDiagram)
}

export function resizeElement(get: Get, set: Set, nodeId: Id, suggestedBounds: Bounds) {
    const diagramId = get(activeDiagramIdAtom);
    const diagram = get(elementsAtom(diagramId)) as ClassDiagramState;
    const nodePlacement = diagram.nodes[nodeId];
    const newWidth = Math.max(10, suggestedBounds.width);
    const newHeight = Math.max(10, suggestedBounds.height);
    const updatedNodePlacement = {
        ...nodePlacement,
        bounds: {
            x: suggestedBounds.x,
            y: suggestedBounds.y,
            width: newWidth,
            height: newHeight
        }
    }
    const updatedDiagram = {...diagram, nodes: {...diagram.nodes, [nodeId]: updatedNodePlacement}};
    set(elementsAtom(diagramId), updatedDiagram)
}

export function nodePropertiesDialog(get: Get, set: Set, elementId: string, dialogResult: DialogOperation) {
    const diagramId = get(activeDiagramIdAtom);
    const diagram = get(elementsAtom(diagramId)) as ClassDiagramState;
    let modalDialog: ClassDiagramModalDialog | undefined;
    switch(dialogResult) {
        case DialogOperation.save:
            modalDialog = undefined;
            break;
        case DialogOperation.cancel:
            modalDialog = undefined;
            break;
        case DialogOperation.open:
            modalDialog = ClassDiagramModalDialog.nodeProperties;
            break;
    }
    const updatedDiagram = {...diagram, modalDialog: modalDialog};
    set(elementsAtom(diagramId), updatedDiagram);
}



// export function autoConnectNodes(diagram: WritableDraft<ClassDiagramState>, sourceId: Id, targetId: Id) {
//     const source = diagram.nodes[sourceId];
//     const target = diagram.nodes[targetId];
//
//     function addNewPort(node: WritableDraft<NodeState>, alignment: PortAlignment) {
//         const result: PortState = {
//             id: generateId(),
//             edgePosRatio: 50,
//             alignment: alignment,
//             depthRatio: 50,
//             latitude: 8,
//             longitude: 8,
//             placement: {} as Bounds,
//         }
//         result.placement = nodePlacementAfterResize(node, portBounds(node.placement, result));
//         node.ports.push(result.id);
//         diagram.ports[result.id] = result;
//         return result
//     }
//
//     const sourcePort = addNewPort(source, PortAlignment.Right);
//
//     const targetPort = addNewPort(target, PortAlignment.Left);
//
//     const linkId = "link-" + sourceId + "-" + targetId;
//     diagram.links[linkId] = {
//         id: linkId,
//         port1: sourcePort.id,
//         port2: targetPort.id,
//         placement: linkPlacement(sourcePort, targetPort)
//     }
// }
