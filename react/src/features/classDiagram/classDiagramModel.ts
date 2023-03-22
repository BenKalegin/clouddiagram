import {Bounds, Coordinate, Diagram} from "../../common/model";
import {PathGenerators} from "../../common/Geometry/PathGenerator";
import {
    DiagramElement,
    ElementType,
    Id,
    IdAndKind,
    LinkState,
    NodeState,
    PortAlignment,
    PortState
} from "../../package/packageModel";
import {selector, selectorFamily} from "recoil";
import {
    DiagramId,
    elementsAtom,
    emptyElementSentinel,
    generateId,
    Linking,
    linkingAtom
} from "../diagramEditor/diagramEditorModel";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";
import {DialogOperation, Get, Set} from "../diagramEditor/diagramEditorSlice";
import {Command} from "../propertiesEditor/PropertiesEditor";
import produce, {Draft} from "immer";

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
    key: 'linkRender',
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


        const node1Placement = get(nodePlacementSelector({nodeId: linking.sourceElement, diagramId: get(activeDiagramIdAtom)}));
        const port1Render =  renderPort(node1Placement.bounds, port1, port1Placement);

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

        const port2Render =  renderPort({x: linking.diagramPos.x, y: linking.diagramPos.y, width: 0, height: 0},
            port2, port2Placement);

        return renderLink(port1, port1Render.bounds, port1Placement, port2, port2Render.bounds, port2Placement);
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
    return node
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

export function addNodeAndConnect(get: Get, set: Set, name: string) {
    const linking = get(linkingAtom) as Linking;
    const pos = linking.diagramPos
    const node = addNewElementAt(get, set, pos, name);
    autoConnectNodes(get, set, linking.sourceElement, node.id);
    set(linkingAtom, {...linking, showLinkToNewDialog: false } )
}


function addNewPort(get: Get, set: Set, node: NodeState) {
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

export function autoConnectNodes(get: Get, set: Set, sourceId: Id, targetId: Id) {
    const diagramId = get(activeDiagramIdAtom);
    const diagram = get(elementsAtom(diagramId)) as ClassDiagramState;

    const sourceNode = get(elementsAtom(sourceId)) as NodeState;
    const targetNode = get(elementsAtom(targetId)) as NodeState;


    const port1 = addNewPort(get, set, sourceNode);
    const port2 = addNewPort(get, set, targetNode);
    const placement1: PortPlacement = {alignment: PortAlignment.Right, edgePosRatio: 50};
    const placement2: PortPlacement = {alignment: PortAlignment.Left, edgePosRatio: 50};


    const linkId = generateId()
    const link: LinkState = {
        id: linkId,
        type: ElementType.ClassLink,
        port1: port1.id,
        port2: port2.id
    }
    set(elementsAtom(linkId), link);

    set(elementsAtom(port1.id), {...port1, links: [...port1.links, linkId]} as PortState);
    set(elementsAtom(port2.id), {...port2, links: [...port2.links, linkId]} as PortState);

    const linkPlacement: LinkPlacement = {};

    const updatedDiagram = {
        ...diagram,
        ports: {...diagram.ports,
            [port1.id]: placement1,
            [port2.id]: placement2
        },
        links: {...diagram.links, [linkId]: linkPlacement}
    };

    set(elementsAtom(diagramId), updatedDiagram);
}


export function handleClassElementPropertyChanged(get: Get, set: Set, elements: IdAndKind[], propertyName: string, value: any) {
    // const diagramId = get(activeDiagramIdAtom)
    // const diagram = get(elementsAtom(diagramId)) as ClassDiagramState;

    // const update = produce(diagram, (draft) => {

        elements.forEach(element => {
            switch (element.type) {
                case ElementType.ClassNode:
                    const object: any = {...get(elementsAtom(element.id))};
                    object[propertyName] = value
                    set(elementsAtom(element.id), object);
            }
        });
    // })

    // set(elementsAtom(diagramId), update);
}

function deleteClassElement(diagram: Draft<ClassDiagramState>, element: IdAndKind,
                            getElement: (id: Id) => DiagramElement,
                            setElement: (id: Id, element: DiagramElement) => void) {
    switch(element.type) {
        case ElementType.ClassNode:
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
    }
    diagram.selectedElements = diagram.selectedElements.filter(e => e.id !== element.id);
}

export function handleClassCommand(get: Get, set: Set, elements: IdAndKind[], command: Command) {
    const diagramId = get(activeDiagramIdAtom)
    const diagram = get(elementsAtom(diagramId)) as ClassDiagramState;
    const getElement = (id: Id) => get(elementsAtom(id));
    const setElement = (id: Id, element: DiagramElement) => set(elementsAtom(id), element);

    const update = produce(diagram, (draft: Draft<ClassDiagramState>) => {
        switch (command) {
            case Command.Delete:
                elements.forEach(element => {
                    deleteClassElement(draft, element, getElement, setElement);
                });
                break;
        }
    })
    set(elementsAtom(diagramId), update);
}
