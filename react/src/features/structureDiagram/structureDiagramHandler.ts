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
import {Bounds, Coordinate, Diagram, withinBounds} from "../../common/model";
import {
    DiagramElement,
    ElementRef,
    ElementType,
    Id,
    LinkState,
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
import {selector, selectorFamily} from "recoil";

export class StructureDiagramHandler implements DiagramHandler {
    // Store the original diagram state for undo operations
    private originalDiagramState: any = null;
    private startElement: ElementRef | null = null;
    private startNodePosition: Coordinate | null = null;

    handleAction(action: Action, get: Get, set: Set): void {
        if (elementMoveAction.match(action)) {
            const {element, currentPointerPos, startNodePos, startPointerPos, phase} = action.payload;

            // For the 'start' phase, store the original state but don't create an undo operation yet
            if (phase === ElementMoveResizePhase.start) {
                const diagramId = get(activeDiagramIdAtom);
                this.originalDiagramState = get(elementsAtom(diagramId));
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
                    const newDiagramState = get(elementsAtom(diagramId)) as Diagram;

                    // Create and add the undo operation
                    const historyOperation = createDiagramChangeOperation(
                        diagramId,
                        this.originalDiagramState,
                        newDiagramState,
                        "Move Element",
                        set
                    );

                    addToHistory(get, set, historyOperation);

                    // Reset the stored state
                    this.originalDiagramState = null;
                    this.startElement = null;
                    this.startNodePosition = null;
                }

                // Update diagram bounds after element move
                const diagramId = get(activeDiagramIdAtom);
                const diagram = get(elementsAtom(diagramId)) as Diagram;
                const bounds = calculateDiagramBounds(diagram);

                // Update the diagram's display property
                const updatedDiagram = {
                    ...diagram,
                    display: {
                        ...diagram.display,
                        scale: diagram.display.scale,
                        offset: diagram.display.offset,
                        width: bounds.width,
                        height: bounds.height
                    }
                };

                set(elementsAtom(diagramId), updatedDiagram);
            }
        } else if (elementResizeAction.match(action)) {
            const {element, suggestedBounds, phase} = action.payload;

            // For the 'start' phase, store the original state but don't create an undo operation yet
            if (phase === ElementMoveResizePhase.start) {
                const diagramId = get(activeDiagramIdAtom);
                this.originalDiagramState = get(elementsAtom(diagramId));
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
                    const newDiagramState = get(elementsAtom(diagramId)) as Diagram;

                    // Create and add the undo operation
                    const historyOperation = createDiagramChangeOperation(
                        diagramId,
                        this.originalDiagramState,
                        newDiagramState,
                        "Resize Element",
                        set
                    );

                    addToHistory(get, set, historyOperation);

                    // Reset the stored state
                    this.originalDiagramState = null;
                    this.startElement = null;
                    this.startNodePosition = null;
                }

                // Update diagram bounds after element resize
                const diagramId = get(activeDiagramIdAtom);
                const diagram = get(elementsAtom(diagramId)) as Diagram;
                const bounds = calculateDiagramBounds(diagram);

                // Update the diagram's display property
                const updatedDiagram = {
                    ...diagram,
                    display: {
                        ...diagram.display,
                        scale: diagram.display.scale,
                        offset: diagram.display.offset,
                        width: bounds.width,
                        height: bounds.height
                    }
                };

                set(elementsAtom(diagramId), updatedDiagram);
            }
        } else if (dropFromPaletteAction.match(action)) {
            addNewElementAt(get, set, action.payload.droppedAt, action.payload.name, action.payload.kind);

            // Update diagram bounds after element drop
            const diagramId = get(activeDiagramIdAtom);
            const diagram = get(elementsAtom(diagramId)) as Diagram;
            const bounds = calculateDiagramBounds(diagram);

            // Update the diagram's display property
            const updatedDiagram = {
                ...diagram,
                display: {
                    ...diagram.display,
                    scale: diagram.display.scale,
                    offset: diagram.display.offset,
                    width: bounds.width,
                    height: bounds.height
                }
            };

            set(elementsAtom(diagramId), updatedDiagram);
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
        if (!nodePlacement) {
            throw new Error(`Node placement is undefined for node ${nodeId}`);
        } else if (!port) {
            throw new Error(`Port is undefined for port ${portId}`);
        } else if (!portPlacement) {
            throw new Error(`Port placement is undefined for port ${portId} on node ${nodeId}`);
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
        return renderLink(port1, sourceRender.bounds, sourcePlacement, port2, targetRender.bounds, targetPlacement, link.routeStyle, link.tipStyle1, link.tipStyle2);
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


        const diagramId = get(activeDiagramIdAtom);
        const diagram = get(elementsAtom(diagramId)) as StructureDiagramState;
        const sourcePlacement = diagram.nodes[linking.sourceElement] || diagram.notes[linking.sourceElement];

        const port1Render = renderPort(sourcePlacement.bounds, port1, port1Placement);

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
    }
})
