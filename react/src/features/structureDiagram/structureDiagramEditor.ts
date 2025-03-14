import {
    DiagramEditor,
    dropFromPaletteAction,
    elementCommandAction,
    elementMoveAction,
    elementPropertyChangedAction,
    elementResizeAction,
    Get,
    Set
} from "../diagramEditor/diagramEditorSlice";
import {Action} from "@reduxjs/toolkit";
import {Bounds, Coordinate, withinBounds} from "../../common/model";
import {
    ConnectionStyle,
    DiagramElement,
    ElementRef,
    ElementType,
    Id,
    LinkState,
    PortAlignment,
    PortState
} from "../../package/packageModel";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";
import {snapToBounds} from "../../common/Geometry/snap";
import {DiagramId, elementsAtom, linkingAtom} from "../diagramEditor/diagramEditorModel";
import {LinkId, LinkRender, PortPlacement, PortRender, StructureDiagramState} from "./structureDiagramState";
import {
    autoConnectNodes,
    nodePlacementSelector,
    portBounds,
    portPlacementSelector,
    portSelector,
    renderLink
} from "../classDiagram/classDiagramModel";
import {
    addNewElementAt,
    addNodeAndConnect,
    handleStructureElementCommand,
    handleStructureElementPropertyChanged,
    moveElement,
    resizeElement
} from "./structureDiagramModel";
import {selector, selectorFamily} from "recoil";

export class StructureDiagramEditor implements DiagramEditor {
    handleAction(action: Action, get: Get, set: Set): void {
        if (elementMoveAction.match(action)) {
            const {element, currentPointerPos, startNodePos, startPointerPos} = action.payload;
            moveElement(get, set, element, currentPointerPos, startPointerPos, startNodePos);
        } else if (elementResizeAction.match(action)) {
            const {element, suggestedBounds} = action.payload;
            resizeElement(get, set, element, suggestedBounds);
        } else if (dropFromPaletteAction.match(action)) {
            addNewElementAt(get, set, action.payload.droppedAt, action.payload.name, action.payload.kind);
        } else if(elementCommandAction.match(action)) {
            const {elements, command} = action.payload;
            handleStructureElementCommand(get, set, elements, command)
        }else if (elementPropertyChangedAction.match(action)) {
            const {elements, propertyName, value} = action.payload;
            handleStructureElementPropertyChanged(get, set, elements, propertyName, value);
        }
    }

    snapToElements(get: Get, diagramPos: Coordinate): [Coordinate, DiagramElement] | undefined {
        const diagramId = get(activeDiagramIdAtom);
        const [targetPortId, targetBounds] = findPortAtPos(get, diagramPos, diagramId, 3);
        if (targetPortId && targetBounds) {
            return [snapToBounds(diagramPos, targetBounds), {id: targetPortId, type: ElementType.ClassPort}]
        }
        const [targetNodeId, targetNodeBounds] = findNodeAtPos(get, diagramPos, diagramId, 3);
        if (targetNodeId && targetNodeBounds) {
            return [snapToBounds(diagramPos, targetNodeBounds), {id: targetNodeId, type: ElementType.ClassNode}]
        }
        return undefined;
    }

    connectNodes(get: Get, set: Set, sourceId: Id, target: ElementRef, diagramPos: Coordinate): void {
        autoConnectNodes(get, set, sourceId, target);
    }

    createAndConnectTo(get: Get, set: Set, name: string): void {
        addNodeAndConnect(get, set, name)
    }

    getElement(get: Get, ref: ElementRef, diagram: StructureDiagramState): DiagramElement {
        switch (ref.type) {
            case ElementType.ClassNode:
            case ElementType.ClassLink:
            case ElementType.DeploymentNode:
            case ElementType.DeploymentLink:
                return get(elementsAtom(ref.id));

            default:
                throw new Error(`Unknown element type: ${ref.type}`);
        }
    }

}

/**
 * Search for a port at specified X,Y diagram position
 */
export function findPortAtPos(get: Get, pos: Coordinate, diagramId: string, tolerance: number): [Id?, Bounds?] {
    const diagram = get(elementsAtom(diagramId)) as StructureDiagramState;
    const portIds = Object.keys(diagram.ports);
    for (let i = 0; i < portIds.length; i++) {
        const portId = portIds[i];
        const port = get(elementsAtom(portId)) as PortState;
        const nodeId = port.nodeId;
        const nodeBounds = diagram.nodes[nodeId].bounds;
        const portBounds = renderPort(nodeBounds, port, diagram.ports[portId]).bounds;
        if (withinBounds(portBounds, pos, tolerance)) {
            return [portId, portBounds];
        }
    }
    return [undefined, undefined];
}

const renderPort = (nodePlacement: Bounds, port: PortState, portPlacement: PortPlacement): PortRender => {
    if (!nodePlacement || !portPlacement) {
        throw new Error('Node placement or port placement is undefined. ');
    }
    return {
        bounds: portBounds(nodePlacement, port, portPlacement)
    }
}

export const portRenderSelector = selectorFamily<PortRender, { portId: Id, nodeId: Id, diagramId: Id }>({
    key: 'portRender',
    get: ({portId, nodeId, diagramId}) => ({get}) => {
        const nodePlacement = get(nodePlacementSelector({nodeId, diagramId}));
        const port = get(portSelector(portId));
        const portPlacement = get(portPlacementSelector({portId, diagramId}));
        if (!nodePlacement || !port || !portPlacement) {
            throw new Error(`Node placement, port, or port placement is undefined for node ${nodeId} and port ${portId}`);
        }
        return renderPort(nodePlacement.bounds, port, portPlacement);
    }
})

export function findNodeAtPos(get: Get, pos: Coordinate, diagramId: string, tolerance: number): [Id?, Bounds?] {
    const diagram = get(elementsAtom(diagramId)) as StructureDiagramState;
    const nodeIds = Object.keys(diagram.nodes);
    for (let i = 0; i < nodeIds.length; i++) {
        const nodeId = nodeIds[i];
        const nodeBounds = diagram.nodes[nodeId].bounds;
        if (withinBounds(nodeBounds, pos, tolerance)) {
            return [nodeId, nodeBounds];
        }
    }
    return [undefined, undefined];
}

export const linkRenderSelector = selectorFamily<LinkRender, { linkId: LinkId, diagramId: DiagramId }>({
    key: 'linkRender',
    get: ({linkId, diagramId}) => ({get}) => {
        const link = get(elementsAtom(linkId)) as LinkState;
        const port1 = get(portSelector(link.port1));
        const port2 = get(portSelector(link.port2));
        const sourceRender = get(portRenderSelector({portId: link.port1, nodeId: port1.nodeId, diagramId}));
        const targetRender = get(portRenderSelector({portId: link.port2, nodeId: port2.nodeId, diagramId}));
        const sourcePlacement = get(portPlacementSelector({portId: link.port1, diagramId}));
        const targetPlacement = get(portPlacementSelector({portId: link.port2, diagramId}));
        return renderLink(port1, sourceRender.bounds, sourcePlacement, port2, targetRender.bounds, targetPlacement, link.linkStyle);
    }
})

export const drawingLinkRenderSelector = selector<LinkRender>({
    key: 'drawLinkRender',
    get: ({get}) => {
        const linking = get(linkingAtom)!

        const port1: PortState = {
            nodeId: "",
            type: ElementType.ClassPort,
            id: "DrawingLinkSourcePort",
            depthRatio: 50,
            latitude: 0,
            longitude: 0,
            links: []
        }

        const port1Placement: PortPlacement = {
            alignment: PortAlignment.Right,
            edgePosRatio: 50,
        }


        const node1Placement = get(nodePlacementSelector({
            nodeId: linking.sourceElement,
            diagramId: get(activeDiagramIdAtom)
        }));
        const port1Render = renderPort(node1Placement.bounds, port1, port1Placement);

        const port2: PortState = {
            nodeId: "",
            type: ElementType.ClassPort,
            id: "DrawingLinkTarget",
            depthRatio: 50,
            latitude: 0,
            longitude: 0,
            links: []
        }

        const port2Placement: PortPlacement = {
            alignment: PortAlignment.Left,
            edgePosRatio: 50,
        }

        const port2Render = renderPort({x: linking.diagramPos.x, y: linking.diagramPos.y, width: 0, height: 0},
            port2, port2Placement);

        return renderLink(port1, port1Render.bounds, port1Placement, port2, port2Render.bounds, port2Placement, ConnectionStyle.Direct);
    }
})



