import {Bounds} from "../../common/model";
import {PathGenerators} from "../../common/Geometry/PathGenerator";
import {
    DiagramElement,
    ElementRef,
    ElementType,
    Id,
    LinkState,
    NodeState,
    PortAlignment,
    PortState
} from "../../package/packageModel";
import {selectorFamily} from "recoil";
import {
    DiagramId,
    elementsAtom,
    emptyElementSentinel,
    generateId
} from "../diagramEditor/diagramEditorModel";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";
import {DialogOperation, Get, Set} from "../diagramEditor/diagramEditorSlice";
import {Command} from "../propertiesEditor/PropertiesEditor";
import produce, {Draft} from "immer";
import {StructureDiagramState} from "../structureDiagram/structureDiagramState";

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

// export enum CornerStyle {
//     Straight = "straight"
// }

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

export interface ClassDiagramState extends StructureDiagramState {
    modalDialog: ClassDiagramModalDialog | undefined
}

export type NodeId = Id;
export type PortId = Id;
export type LinkId = Id;


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


export const renderLink = (sourcePort: PortState, sourceBounds: Bounds, sourcePlacement: PortPlacement,
                           targetPort: PortState, targetBounds: Bounds, targetPlacement: PortPlacement): LinkRender => {

    return {
        // svgPath: PathGenerators.Smooth(link, [p1, p2], p1, p2).path
        svgPath: PathGenerators.Straight([], sourcePort, sourceBounds, sourcePlacement, targetPort, targetBounds, targetPlacement).path
    };
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

export function autoConnectNodes(get: Get, set: Set, sourceId: Id, target: ElementRef) {
    const diagramId = get(activeDiagramIdAtom);
    const diagram = get(elementsAtom(diagramId)) as ClassDiagramState;

    const sourceNode = get(elementsAtom(sourceId)) as NodeState;
    const port1 = addNewPort(get, set, sourceNode);
    const placement1: PortPlacement = {alignment: PortAlignment.Right, edgePosRatio: 50};

    let port2: PortState;
    let placement2: PortPlacement;
    if (target.type === ElementType.ClassNode) {
        const targetNode = get(elementsAtom(target.id)) as NodeState;
        port2 = addNewPort(get, set, targetNode);
        placement2 = {alignment: PortAlignment.Left, edgePosRatio: 50};
    } else if (target.type === ElementType.ClassPort) {
        port2 = get(elementsAtom(target.id)) as PortState;
        placement2 = diagram.ports[port2.id]
    }else
        throw new Error("Invalid target type " + target.type);


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


export function handleClassElementPropertyChanged(get: Get, set: Set, elements: ElementRef[], propertyName: string, value: any) {
    const diagramId = get(activeDiagramIdAtom)
    const originalDiagram = get(elementsAtom(diagramId)) as ClassDiagramState;

    elements.forEach(element => {
        switch (element.type) {
            case ElementType.ClassNode:
                const node = get(elementsAtom(element.id)) as NodeState;
                const update = produce(node, (draft: Draft<NodeState>) => {
                    const object: any = draft;
                    object[propertyName] = value
                })
                set(elementsAtom(element.id), update);
                break;
            case ElementType.Note:
                const diagramUpdate = produce(originalDiagram, (diagram: Draft<ClassDiagramState>) => {
                    const object: any = diagram.notes[element.id];
                    object[propertyName] = value
                })
                set(elementsAtom(diagramId), diagramUpdate);
        }
    });
}

function deleteClassElement(diagram: Draft<ClassDiagramState>, element: ElementRef,
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

export function handleClassCommand(get: Get, set: Set, elements: ElementRef[], command: Command) {
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


