import {Get, Set} from "../diagramEditor/diagramEditorSlice";
import {
    CustomShape,
    defaultCornerStyle,
    defaultNoteHeight,
    defaultNoteStyle,
    defaultNoteWidth,
    defaultRouteStyle,
    DiagramElement,
    ElementRef,
    ElementType,
    Id,
    LinkState,
    NodeState,
    PictureLayout,
    PortAlignment,
    PortState,
    RouteStyle,
    TipStyle
} from "../../package/packageModel";
import {Bounds, Coordinate} from "../../common/model";
import {activeDiagramIdAtom} from "../diagramTabs/diagramTabsModel";
import {
    DiagramId,
    elementsAtom,
    emptyElementSentinel,
    generateId,
    Linking,
    linkingAtom,
    snapGridSizeAtom
} from "../diagramEditor/diagramEditorModel";
import produce, {Draft} from "immer";
import {snapToGrid} from "../../common/Geometry/snap";
import {
    LinkPlacement,
    LinkRender,
    NodeId,
    NodePlacement,
    PortId,
    PortPlacement,
    StructureDiagramState
} from "./structureDiagramState";
import {NoteState} from "../commonComponents/commonComponentsModel";
import {TypeAndSubType} from "../diagramTabs/HtmlDrop";
import {Command} from "../propertiesEditor/propertiesEditorModel";
import {selectorFamily} from "recoil";
import {generatePath} from "../../common/Geometry/PathGenerator";
import {defaultColorSchema} from "../../common/colors/colorSchemas";
import {withElementHistory, withHistory} from "../diagramEditor/historySlice";

// Original function for element movement
export const moveElementImpl = (get: Get, set: Set, element: ElementRef, currentPointerPos: Coordinate, startPointerPos: Coordinate, startNodePos: Coordinate, snap: boolean = true) => {
    const diagramId = get(activeDiagramIdAtom);
    const originalDiagram = get(elementsAtom(diagramId)) as StructureDiagramState;

    function updateElementPos(bounds: Draft<Bounds>) {
        const rawPos = {
            x: startNodePos.x + currentPointerPos.x - startPointerPos.x,
            y: startNodePos.y + currentPointerPos.y - startPointerPos.y
        };
        const pos = snap ? snapToGrid(rawPos, get(snapGridSizeAtom)) : rawPos;
        bounds.x = pos.x;
        bounds.y = pos.y;
    }

    const update = produce(originalDiagram, (diagram: Draft<StructureDiagramState>) => {
        switch (element.type) {
            case ElementType.ClassNode:
                updateElementPos(diagram.nodes[element.id].bounds);
                break;
            case ElementType.Note:
                updateElementPos(diagram.notes[element.id].bounds);
                break;
        }
    })
    set(elementsAtom(diagramId), update)
}

// Export the wrapped function with history tracking
export const moveElement = withHistory(moveElementImpl, "Move Element");

// Original function for element resizing
export const resizeElementImpl = (get: Get, set: Set, element: ElementRef, suggestedBounds: Bounds) => {
    const diagramId = get(activeDiagramIdAtom);
    const originalDiagram = get(elementsAtom(diagramId)) as StructureDiagramState;

    const update = produce(originalDiagram, (diagram: Draft<StructureDiagramState>) => {
        switch (element.type) {
            case ElementType.ClassNode:
            case ElementType.DeploymentNode:
                const bounds = diagram.nodes[element.id].bounds
                bounds.x = suggestedBounds.x;
                bounds.y = suggestedBounds.y;
                bounds.width = Math.max(10, suggestedBounds.width);
                bounds.height = Math.max(10, suggestedBounds.height);
                break;
            case ElementType.Note:
                const noteBounds = diagram.notes[element.id].bounds
                noteBounds.x = suggestedBounds.x;
                noteBounds.y = suggestedBounds.y;
                noteBounds.width = Math.max(10, suggestedBounds.width);
                noteBounds.height = Math.max(10, suggestedBounds.height);
                break;
        }
    })
    set(elementsAtom(diagramId), update)
}

// Export the wrapped function with history tracking
export const resizeElement = withHistory(resizeElementImpl, "Resize Element");

export const structureDiagramSelector = selectorFamily<StructureDiagramState, DiagramId>({
    key: 'structureDiagram',
    get: (id) => ({get}) => {
        return get(elementsAtom(id)) as StructureDiagramState;
    },
    set: (id) => ({set}, newValue) => {
        set(elementsAtom(id), newValue);
    }
})
export const nodePlacementSelector = selectorFamily<NodePlacement, { nodeId: NodeId, diagramId: DiagramId }>({
    key: 'nodePlacement',
    get: ({nodeId, diagramId}) => ({get}) => {
        const diagram = get(structureDiagramSelector(diagramId));
        return diagram.nodes[nodeId];
    }
})
export const portPlacementSelector = selectorFamily<PortPlacement, { portId: Id, diagramId: Id }>({
    key: 'portPlacement',
    get: ({portId, diagramId}) => ({get}) => {
        const diagram = get(structureDiagramSelector(diagramId));
        return diagram.ports[portId];
    }
})

// Original function wrapped with history tracking
const autoConnectNodesImpl = (get: Get, set: Set, sourceId: Id, target: ElementRef) => {
    const diagramId = get(activeDiagramIdAtom);
    const diagram = get(elementsAtom(diagramId)) as StructureDiagramState;

    const sourceNode = get(elementsAtom(sourceId)) as NodeState;
    const port1 = addNewPort(get, set, sourceNode);
    const placement1: PortPlacement = {alignment: PortAlignment.Right, edgePosRatio: 50};

    let port2: PortState;
    let placement2: PortPlacement;
    if (target.type === ElementType.ClassNode || target.type === ElementType.DeploymentNode) {
        const targetNode = get(elementsAtom(target.id)) as NodeState;
        port2 = addNewPort(get, set, targetNode);
        placement2 = {alignment: PortAlignment.Left, edgePosRatio: 50};
    } else if (target.type === ElementType.ClassPort) {
        port2 = get(elementsAtom(target.id)) as PortState;
        placement2 = diagram.ports[port2.id]
    } else
        throw new Error("Invalid target type " + target.type);


    const linkId = generateId()
    const link: LinkState = {
        id: linkId,
        type: ElementType.ClassLink,
        port1: port1.id,
        port2: port2.id,
        tipStyle1: TipStyle.None,
        tipStyle2: TipStyle.Arrow,
        colorSchema: defaultColorSchema,
        routeStyle: defaultRouteStyle,
        cornerStyle: defaultCornerStyle
    }
    set(elementsAtom(linkId), link);

    set(elementsAtom(port1.id), {...port1, links: [...port1.links, linkId]} as PortState);
    set(elementsAtom(port2.id), {...port2, links: [...port2.links, linkId]} as PortState);

    const linkPlacement: LinkPlacement = {};

    const updatedDiagram = {
        ...diagram,
        ports: {
            ...diagram.ports,
            [port1.id]: placement1,
            [port2.id]: placement2
        },
        links: {...diagram.links, [linkId]: linkPlacement}
    };

    set(elementsAtom(diagramId), updatedDiagram);
}

// Export the wrapped function
export const autoConnectNodes = withHistory(autoConnectNodesImpl, "Connect Nodes");

// Original function wrapped with history tracking
const addNodeAndConnectImpl = (get: Get, set: Set, name: string) => {
    const linking = get(linkingAtom) as Linking;
    const pos = linking.diagramPos
    const node = addNewElementAt(get, set, pos, name, {type: ElementType.ClassNode});
    autoConnectNodes(get, set, linking.sourceElement, node as ElementRef);
    set(linkingAtom, {...linking, showLinkToNewDialog: false})
}

// Export the wrapped function
export const addNodeAndConnect = withHistory(addNodeAndConnectImpl, "Add and Connect Node");


// Original function wrapped with history tracking
const addNewElementAtImpl = (get: Get, set: Set, droppedAt: Coordinate, name: string, elementType: TypeAndSubType): ElementRef => {
    if (elementType.type === ElementType.Note) {
        const diagramId = get(activeDiagramIdAtom);
        const note: NoteState = {
            type: ElementType.Note,
            id: generateId(),
            text: name,
            colorSchema: defaultNoteStyle,
            bounds: {
                x: droppedAt.x - defaultNoteWidth / 2,
                y: droppedAt.y,
                width: defaultNoteWidth,
                height: defaultNoteHeight
            }
        };

        const diagram = get(elementsAtom(diagramId)) as StructureDiagramState;
        const updatedDiagram = {...diagram, notes: {...diagram.notes, [note.id]: note}};
        set(elementsAtom(diagramId), updatedDiagram)
        return note
    }

    if (elementType.type === ElementType.ClassNode || elementType.type === ElementType.DeploymentNode) {
        const defaultWidth = 100;
        const defaultHeight = 80;
        const diagramId = get(activeDiagramIdAtom);
        const customShape: CustomShape | undefined = elementType.subType ?
            {
                layout: PictureLayout.FullIconTextBelow,
                pictureId: elementType.subType,
            }
            : undefined;

        const node: NodeState = {
            type: elementType.type,
            id: generateId(),
            text: name,
            ports: [],
            colorSchema: defaultColorSchema,
            customShape: customShape,
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
        const diagram = get(elementsAtom(diagramId)) as StructureDiagramState;
        const updatedDiagram = {...diagram, nodes: {...diagram.nodes, [node.id]: placement}};
        set(elementsAtom(diagramId), updatedDiagram)
        return node
    }

    throw new Error("Unknown element type: " + elementType);
}

// Export the wrapped function
export const addNewElementAt = withHistory(addNewElementAtImpl, "Add Element");

function deleteSelectedElement(diagram: Draft<StructureDiagramState>, element: ElementRef,
                               getElement: (id: Id) => DiagramElement,
                               setElement: (id: Id, element: DiagramElement) => void) {
    switch (element.type) {
        case ElementType.Note:
            delete diagram.notes[element.id];
            setElement(element.id, emptyElementSentinel);
            break;

        case ElementType.ClassNode:
        case ElementType.DeploymentNode:
            const node = getElement(element.id) as NodeState;
            node.ports.forEach(portId => {
                const port = getElement(portId) as PortState;
                port.links.forEach(linkId => {
                    delete diagram.links[linkId];
                    setElement(linkId, emptyElementSentinel);
                })
                delete diagram.ports[portId];
                setElement(portId, emptyElementSentinel);
            })

            delete diagram.nodes[element.id];

            setElement(element.id, emptyElementSentinel);
            break;
        case ElementType.ClassLink:
        case ElementType.DeploymentLink:
            const link = getElement(element.id) as LinkState;
            const port1 = getElement(link.port1) as PortState;
            const port2 = getElement(link.port2) as PortState;

            setElement(link.port1, { ...port1, links: port1.links.filter(l => l !== element.id) } as PortState);
            setElement(link.port2, { ...port2, links: port2.links.filter(l => l !== element.id) } as PortState);

            delete diagram.links[element.id];
            setElement(element.id, emptyElementSentinel);
            break;
    }
    diagram.selectedElements = diagram.selectedElements.filter(e => e.id !== element.id);
}


export enum SelectDirection {
    North,
    South,
    East,
    West
}

function selectNextNode(elements: ElementRef[], draft: Draft<StructureDiagramState>, direction: SelectDirection) {
    function calculateDistance(thisPlacement: NodePlacement, otherPlacement: NodePlacement) {
        switch (direction) {
            case SelectDirection.East:
                return (thisPlacement.bounds.x - otherPlacement.bounds.x) * 1000 + Math.abs(thisPlacement.bounds.y - otherPlacement.bounds.y);
            case SelectDirection.West:
                return (otherPlacement.bounds.x - thisPlacement.bounds.x) * 1000 + Math.abs(thisPlacement.bounds.y - otherPlacement.bounds.y);
            case SelectDirection.North:
                return (thisPlacement.bounds.y - otherPlacement.bounds.y) * 1000 + Math.abs(thisPlacement.bounds.x - otherPlacement.bounds.x);
            case SelectDirection.South:
                return (otherPlacement.bounds.y - thisPlacement.bounds.y) * 1000 + Math.abs(thisPlacement.bounds.x - otherPlacement.bounds.x);
        }
    }

    if (elements.length === 1 && elements[0].type === ElementType.ClassNode) {
        const nodePlacement = draft.nodes[elements[0].id];
        let closestElement: ElementRef | undefined = undefined;
        let closestDistance = Number.MAX_VALUE;
        Object.entries(draft.nodes).forEach(([id, placement]) => {
            if (id !== elements[0].id) {
                const distance = calculateDistance(nodePlacement, placement);
                if (distance > 0 && distance < closestDistance) {
                    closestElement = {id: id, type: ElementType.ClassNode}
                    closestDistance = distance;
                }
            }
        })
        if (closestElement) {
            draft.selectedElements = [closestElement];
        }
    }
}


// Original function wrapped with history tracking
const handleStructureElementCommandImpl = (get: Get, set: Set, elements: ElementRef[], command: Command) => {
    const diagramId = get(activeDiagramIdAtom)
    const diagram = get(elementsAtom(diagramId)) as StructureDiagramState;
    const getElement = (id: Id) => get(elementsAtom(id));
    const setElement = (id: Id, element: DiagramElement) => set(elementsAtom(id), element);

    const update = produce(diagram, (draft: Draft<StructureDiagramState>) => {
        switch (command) {
            case Command.Delete:
                elements.forEach(element => {
                    deleteSelectedElement(draft, element, getElement, setElement);
                });
                break;
            case Command.SelectNextLeft:
                selectNextNode(elements, draft, SelectDirection.East);
                break;
            case Command.SelectNextRight:
                selectNextNode(elements, draft, SelectDirection.West);
                break;
            case Command.SelectNextUp:
                selectNextNode(elements, draft, SelectDirection.North);
                break;
            case Command.SelectNextDown:
                selectNextNode(elements, draft, SelectDirection.South);
                break;

        }
    })
    set(elementsAtom(diagramId), update);
}

// Export the wrapped function
export const handleStructureElementCommand = withHistory(handleStructureElementCommandImpl, "Execute Command");

// Function to handle node property changes (wrapped with element history)
const handleNodePropertyChangedImpl = (get: Get, set: Set, element: ElementRef, propertyName: string, value: any) => {
    const node = get(elementsAtom(element.id)) as NodeState;
    const update: NodeState = (propertyName === "customShape")
        ? {...node, customShape: {...value, pictureId: node.customShape?.pictureId}}
        : produce(node, (draft: Draft<NodeState>) => {
            const object: any = draft;
            object[propertyName] = value
        });
    set(elementsAtom(element.id), update);
};

// Function to handle link property changes (wrapped with element history)
const handleLinkPropertyChangedImpl = (get: Get, set: Set, element: ElementRef, propertyName: string, value: any) => {
    const link = get(elementsAtom(element.id)) as LinkState;
    const update = produce(link, (draft: Draft<LinkState>) => {
        const object: any = draft;
        object[propertyName] = value
    });
    set(elementsAtom(element.id), update);
};

// Function to handle note property changes (wrapped with diagram history)
const handleNotePropertyChangedImpl = (get: Get, set: Set, element: ElementRef, propertyName: string, value: any) => {
    const diagramId = get(activeDiagramIdAtom);
    const originalDiagram = get(elementsAtom(diagramId)) as StructureDiagramState;
    const diagramUpdate = produce(originalDiagram, (diagram: Draft<StructureDiagramState>) => {
        const object: any = diagram.notes[element.id];
        object[propertyName] = value
    });
    set(elementsAtom(diagramId), diagramUpdate);
};

// Create wrapped versions of the implementation functions
const handleNodePropertyChanged = (elementId: string) =>
    withElementHistory(handleNodePropertyChangedImpl, elementId, "Change Node Property");

const handleLinkPropertyChanged = (elementId: string) =>
    withElementHistory(handleLinkPropertyChangedImpl, elementId, "Change Link Property");

const handleNotePropertyChanged = withHistory(handleNotePropertyChangedImpl, "Change Note Property");

// Main function to handle property changes for any element type
export const handleStructureElementPropertyChanged = (get: Get, set: Set, elements: ElementRef[], propertyName: string, value: any) => {
    elements.forEach(element => {
        switch (element.type) {
            case ElementType.ClassNode:
            case ElementType.DeploymentNode:
                handleNodePropertyChanged(element.id)(get, set, element, propertyName, value);
                break;
            case ElementType.ClassLink:
            case ElementType.DeploymentLink:
                handleLinkPropertyChanged(element.id)(get, set, element, propertyName, value);
                break;
            case ElementType.Note:
                handleNotePropertyChanged(get, set, element, propertyName, value);
                break;
        }
    });
};

export const renderLink = (sourcePort: PortState, sourceBounds: Bounds, sourcePlacement: PortPlacement,
                           targetPort: PortState, targetBounds: Bounds, targetPlacement: PortPlacement, linkStyle: RouteStyle, tipStyle1: TipStyle, tipStyle2: TipStyle): LinkRender => {
    // Calculate bounds that encompass both source and target
    const minX = Math.min(sourceBounds.x, targetBounds.x);
    const minY = Math.min(sourceBounds.y, targetBounds.y);
    const maxX = Math.max(sourceBounds.x + sourceBounds.width, targetBounds.x + targetBounds.width);
    const maxY = Math.max(sourceBounds.y + sourceBounds.height, targetBounds.y + targetBounds.height);

    // Add some padding to ensure the path is fully contained
    const padding = 20;

    return {
        svgPath: generatePath(sourcePort, sourceBounds, sourcePlacement, targetPort, targetBounds, targetPlacement, linkStyle, tipStyle1, tipStyle2),
        bounds: {
            x: minX - padding,
            y: minY - padding,
            width: maxX - minX + padding * 2,
            height: maxY - minY + padding * 2
        }
    }
}

export function addNewPort(_get: Get, set: Set, node: NodeState) {
    const result: PortState = {
        nodeId: node.id,
        type: ElementType.ClassPort,
        id: generateId(),
        depthRatio: 50,
        latitude: 8,
        longitude: 8,
        links: []
    }
    set(elementsAtom(result.id), result);
    set(elementsAtom(node.id), {...node, ports: [...node.ports, result.id]} as NodeState);
    return result
}

export const portSelector = selectorFamily<PortState, PortId>({
    key: 'port',
    get: (portId) => ({get}) => {
        return get(elementsAtom(portId)) as PortState;
    }
})
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
