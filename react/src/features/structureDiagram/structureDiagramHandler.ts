import {
    calculateDiagramBounds,
    DiagramHandler,
    dropFromPaletteAction,
    elementCommandAction,
    elementMoveAction,
    ElementMoveResizePhase,
    elementPropertyChangedAction,
    elementResizeAction,
    Get,
    Set
} from "../diagramEditor/diagramEditorSlice";
import { addToHistory, createDiagramChangeOperation } from "../diagramEditor/historyModel";
import {Action} from "@reduxjs/toolkit";
import {Bounds, Coordinate, defaultDiagramDisplay, Diagram, withinBounds} from "../../common/model";
import {
    DiagramElement,
    ElementRef,
    ElementType,
    Id,
    LinkState,
    NodeState,
    TipStyle,
    PortAlignment,
    PortState,
    RouteStyle
} from "../../package/packageModel";
import {activeDiagramIdAtom} from "../diagramTabs/diagramTabsModel";
import {snapToBounds} from "../../common/Geometry/snap";
import {DiagramId, elementsAtom, linkingAtom} from "../diagramEditor/diagramEditorModel";
import {LinkId, LinkRender, PortPlacement, PortRender, StructureDiagramState} from "./structureDiagramState";
import {
    addNewElementAt,
    addNodeAndConnect,
    autoConnectNodes,
    handleStructureElementCommand,
    handleStructureElementPropertyChanged,
    moveElementImpl,
    nodePlacementSelector,
    portBounds,
    portPlacementSelector,
    portSelector,
    renderLink,
    resizeElementImpl
} from "./structureDiagramModel";
import {atom} from "jotai";
import {atomFamily} from "jotai-family";

const PORT_SNAP_DISTANCE = 22;

export class StructureDiagramHandler implements DiagramHandler {
    // Store the original diagram state for undo operations
    private originalDiagramState: any = null;
    private originalElementState: DiagramElement | null = null;
    private startElement: ElementRef | null = null;
    private startNodePosition: Coordinate | null = null;

    handleAction(action: Action, get: Get, set: Set): void {
        if (elementMoveAction.match(action)) {
            const {element, currentPointerPos, startNodePos, startPointerPos, phase} = action.payload;

            // For the 'start' phase, store the original state but don't create an undo operation yet
            if (phase === ElementMoveResizePhase.start) {
                const diagramId = get(activeDiagramIdAtom);
                this.originalDiagramState = get(elementsAtom(diagramId));
                this.originalElementState = get(elementsAtom(element.id));
                this.startElement = element;
                this.startNodePosition = startNodePos;

                // Just update the position without creating an undo operation
                moveElementImpl(get, set, element, currentPointerPos, startPointerPos, startNodePos, true);
            }
            // For the 'move' phase, just update the position without creating an undo operation
            else if (phase === ElementMoveResizePhase.move) {
                moveElementImpl(get, set, element, currentPointerPos, startPointerPos, startNodePos, false);
            }
            // For the 'end' phase, create a single undo operation for the entire move
            else if (phase === ElementMoveResizePhase.end) {
                // First update the position
                moveElementImpl(get, set, element, currentPointerPos, startPointerPos, startNodePos, true);

                // Then create an undo operation if we have the original state
                if (this.originalDiagramState && this.startElement && this.startElement.id === element.id) {
                    const diagramId = get(activeDiagramIdAtom);
                    addDiagramAndElementHistory(
                        get,
                        set,
                        diagramId,
                        element.id,
                        this.originalDiagramState,
                        get(elementsAtom(diagramId)) as Diagram,
                        this.originalElementState,
                        get(elementsAtom(element.id)),
                        "Move Element"
                    );

                    // Reset the stored state
                    this.originalDiagramState = null;
                    this.originalElementState = null;
                    this.startElement = null;
                    this.startNodePosition = null;
                }

                updateActiveDiagramBounds(get, set);
            }
        } else if (elementResizeAction.match(action)) {
            const {element, suggestedBounds, phase} = action.payload;

            // For the 'start' phase, store the original state but don't create an undo operation yet
            if (phase === ElementMoveResizePhase.start) {
                const diagramId = get(activeDiagramIdAtom);
                this.originalDiagramState = get(elementsAtom(diagramId));
                this.originalElementState = get(elementsAtom(element.id));
                this.startElement = element;

                // Just update the bounds without creating an undo operation
                resizeElementImpl(get, set, element, suggestedBounds);
            }
            // For the 'move' phase, just update the bounds without creating an undo operation
            else if (phase === ElementMoveResizePhase.move) {
                resizeElementImpl(get, set, element, suggestedBounds);
            }
            // For the 'end' phase, create a single undo operation for the entire resize
            else if (phase === ElementMoveResizePhase.end) {
                // First update the bounds
                resizeElementImpl(get, set, element, suggestedBounds);

                // Then create an undo operation if we have the original state
                if (this.originalDiagramState && this.startElement && this.startElement.id === element.id) {
                    const diagramId = get(activeDiagramIdAtom);
                    addDiagramAndElementHistory(
                        get,
                        set,
                        diagramId,
                        element.id,
                        this.originalDiagramState,
                        get(elementsAtom(diagramId)) as Diagram,
                        this.originalElementState,
                        get(elementsAtom(element.id)),
                        "Resize Element"
                    );

                    // Reset the stored state
                    this.originalDiagramState = null;
                    this.originalElementState = null;
                    this.startElement = null;
                    this.startNodePosition = null;
                }

                updateActiveDiagramBounds(get, set);
            }
        } else if (dropFromPaletteAction.match(action)) {
            addNewElementAt(get, set, action.payload.droppedAt, action.payload.name, action.payload.kind);
            updateActiveDiagramBounds(get, set);
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
            const [closestPortId, closestPortBounds] = findClosestNodePort(get, diagramPos, diagramId, targetNodeId, PORT_SNAP_DISTANCE);
            if (closestPortId && closestPortBounds) {
                return [snapToBounds(diagramPos, closestPortBounds), {id: closestPortId, type: ElementType.ClassPort}]
            }
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

function addDiagramAndElementHistory(
    get: Get,
    set: Set,
    diagramId: DiagramId,
    elementId: Id,
    oldDiagram: Diagram,
    newDiagram: Diagram,
    oldElement: DiagramElement | null,
    newElement: DiagramElement,
    description: string
): void {
    if (!oldElement || oldElement === newElement) {
        addToHistory(get, set, createDiagramChangeOperation(diagramId, oldDiagram, newDiagram, description, set));
        return;
    }

    addToHistory(get, set, {
        diagramId,
        description,
        undo: (_get, setUndo) => {
            const setter = setUndo ?? set;
            setter(elementsAtom(elementId), oldElement);
            setter(elementsAtom(diagramId), oldDiagram);
        },
        redo: (_get, setRedo) => {
            const setter = setRedo ?? set;
            setter(elementsAtom(elementId), newElement);
            setter(elementsAtom(diagramId), newDiagram);
        }
    });
}

function updateActiveDiagramBounds(get: Get, set: Set): void {
    const diagramId = get(activeDiagramIdAtom);
    const diagram = get(elementsAtom(diagramId)) as Diagram;
    const bounds = calculateDiagramBounds(diagram);
    const display = diagram.display ?? defaultDiagramDisplay;

    const updatedDiagram: Diagram = {
        ...diagram,
        display: {
            ...defaultDiagramDisplay,
            ...display,
            offset: display.offset ?? defaultDiagramDisplay.offset,
            width: bounds.width,
            height: bounds.height
        }
    };

    set(elementsAtom(diagramId), updatedDiagram);
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

interface PortRenderParam {
    portId: Id;
    nodeId: Id;
    diagramId: Id;
}

export const portRenderSelector = atomFamily(
    (param: PortRenderParam) =>
        atom((get) => {
            const nodePlacement = get(nodePlacementSelector({nodeId: param.nodeId, diagramId: param.diagramId}));
            const port = get(portSelector(param.portId));
            const portPlacement = get(portPlacementSelector({portId: param.portId, diagramId: param.diagramId}));
            if (!nodePlacement) {
                throw new Error(`Node placement is undefined for node ${param.nodeId}`);
            } else if (!port) {
                throw new Error(`Port is undefined for port ${param.portId}`);
            } else if (!portPlacement) {
                throw new Error(`Port placement is undefined for port ${param.portId} on node ${param.nodeId}`);
            }
            return renderPort(nodePlacement.bounds, port, portPlacement);
        }),
    (a, b) => a.portId === b.portId && a.nodeId === b.nodeId && a.diagramId === b.diagramId
);

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

export function findClosestNodePort(
    get: Get,
    pos: Coordinate,
    diagramId: string,
    nodeId: string,
    maxDistance: number
): [Id?, Bounds?] {
    const diagram = get(elementsAtom(diagramId)) as StructureDiagramState;
    const node = get(elementsAtom(nodeId)) as NodeState;
    const nodeBounds = diagram.nodes[nodeId]?.bounds;
    if (!node || !nodeBounds) {
        return [undefined, undefined];
    }

    let bestPortId: Id | undefined;
    let bestPortBounds: Bounds | undefined;
    let bestDistance = maxDistance;

    for (const portId of node.ports) {
        const port = get(elementsAtom(portId)) as PortState;
        const placement = diagram.ports[portId];
        if (!port || !placement) {
            continue;
        }

        const bounds = renderPort(nodeBounds, port, placement).bounds;
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        const distance = Math.hypot(centerX - pos.x, centerY - pos.y);

        if (distance <= bestDistance) {
            bestDistance = distance;
            bestPortId = portId;
            bestPortBounds = bounds;
        }
    }

    return [bestPortId, bestPortBounds];
}

interface LinkRenderParam {
    linkId: LinkId;
    diagramId: DiagramId;
}

export const linkRenderSelector = atomFamily(
    (param: LinkRenderParam) =>
        atom((get) => {
            const link = get(elementsAtom(param.linkId)) as LinkState;
            const port1 = get(portSelector(link.port1));
            const port2 = get(portSelector(link.port2));
            const sourceRender = get(portRenderSelector({portId: link.port1, nodeId: port1.nodeId, diagramId: param.diagramId}));
            const targetRender = get(portRenderSelector({portId: link.port2, nodeId: port2.nodeId, diagramId: param.diagramId}));
            const sourcePlacement = get(portPlacementSelector({portId: link.port1, diagramId: param.diagramId}));
            const targetPlacement = get(portPlacementSelector({portId: link.port2, diagramId: param.diagramId}));
            return renderLink(port1, sourceRender.bounds, sourcePlacement, port2, targetRender.bounds, targetPlacement, link.routeStyle, link.tipStyle1, link.tipStyle2);
        }),
    (a, b) => a.linkId === b.linkId && a.diagramId === b.diagramId
);

const createTempPort = (id: string): PortState => ({
    nodeId: "",
    type: ElementType.ClassPort,
    id,
    depthRatio: 50,
    latitude: 0,
    longitude: 0,
    links: []
});

export const drawingLinkRenderSelector = atom<LinkRender>((get) => {
        const linking = get(linkingAtom)!

        const port1 = createTempPort("DrawingLinkSourcePort");
        const port1Placement: PortPlacement = {
            alignment: PortAlignment.Right,
            edgePosRatio: 50,
        }

        const diagramId = get(activeDiagramIdAtom);
        const diagram = get(elementsAtom(diagramId)) as StructureDiagramState;
        const sourcePlacement = diagram.nodes[linking.sourceElement] || diagram.notes[linking.sourceElement];

        const port1Render = renderPort(sourcePlacement.bounds, port1, port1Placement);

        const port2 = createTempPort("DrawingLinkTarget");
        const port2Placement: PortPlacement = {
            alignment: PortAlignment.Left,
            edgePosRatio: 50,
        }

        const port2Render = renderPort({x: linking.diagramPos.x, y: linking.diagramPos.y, width: 0, height: 0},
            port2, port2Placement);

        // Calculate bounds for the drawing link
        const sourceBounds = port1Render.bounds;
        const targetBounds = {x: linking.diagramPos.x, y: linking.diagramPos.y, width: 0, height: 0};
        const minX = Math.min(sourceBounds.x, targetBounds.x);
        const minY = Math.min(sourceBounds.y, targetBounds.y);
        const maxX = Math.max(sourceBounds.x + sourceBounds.width, targetBounds.x + targetBounds.width);
        const maxY = Math.max(sourceBounds.y + sourceBounds.height, targetBounds.y + targetBounds.height);

        // Add some padding to ensure the path is fully contained
        const padding = 20;

        const linkRender = renderLink(port1, port1Render.bounds, port1Placement, port2, port2Render.bounds, port2Placement, RouteStyle.Direct,
            TipStyle.None, TipStyle.None);

        // Override the bounds with our calculated bounds
        linkRender.bounds = {
            x: minX - padding,
            y: minY - padding,
            width: maxX - minX + padding * 2,
            height: maxY - minY + padding * 2
        };

        return linkRender;
});
