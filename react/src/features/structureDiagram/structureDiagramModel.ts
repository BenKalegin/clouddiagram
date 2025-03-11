import {Get, Set} from "../diagramEditor/diagramEditorSlice";
import {
    CustomShape,
    defaultColorSchema,
    defaultNoteHeight,
    defaultNoteStyle,
    defaultNoteWidth,
    DiagramElement,
    ElementRef,
    ElementType,
    Id,
    NodeState,
    PictureLayout,
    PortState
} from "../../package/packageModel";
import {Bounds, Coordinate} from "../../common/model";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";
import {
    elementsAtom,
    emptyElementSentinel,
    generateId,
    Linking,
    linkingAtom,
    snapGridSizeAtom
} from "../diagramEditor/diagramEditorModel";
import produce, {Draft} from "immer";
import {snapToGrid} from "../../common/Geometry/snap";
import {StructureDiagramState} from "./structureDiagramState";
import {autoConnectNodes, ClassDiagramState, NodePlacement} from "../classDiagram/classDiagramModel";
import {NoteState} from "../commonComponents/commonComponentsModel";
import {TypeAndSubType} from "../diagramTabs/HtmlDrop";
import {Command} from "../propertiesEditor/PropertiesEditor";

export function moveElement(get: Get, set: Set, element: ElementRef, currentPointerPos: Coordinate, startPointerPos: Coordinate, startNodePos: Coordinate) {
    const diagramId = get(activeDiagramIdAtom);
    const originalDiagram = get(elementsAtom(diagramId)) as StructureDiagramState;

    function updateElementPos(bounds: Draft<Bounds>) {
        const pos = snapToGrid({
            x: startNodePos.x + currentPointerPos.x - startPointerPos.x,
            y: startNodePos.y + currentPointerPos.y - startPointerPos.y
        }, get(snapGridSizeAtom))
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

export function resizeElement(get: Get, set: Set, element: ElementRef, suggestedBounds: Bounds) {
    const diagramId = get(activeDiagramIdAtom);
    const originalDiagram = get(elementsAtom(diagramId)) as StructureDiagramState;

    const update = produce(originalDiagram, (diagram: Draft<StructureDiagramState>) => {
        switch (element.type) {
            case ElementType.ClassNode:
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

export function addNodeAndConnect(get: Get, set: Set, name: string) {
    const linking = get(linkingAtom) as Linking;
    const pos = linking.diagramPos
    const node = addNewElementAt(get, set, pos, name, {type: ElementType.ClassNode});
    autoConnectNodes(get, set, linking.sourceElement, node as ElementRef);
    set(linkingAtom, {...linking, showLinkToNewDialog: false})
}


export function addNewElementAt(get: Get, set: Set, droppedAt: Coordinate, name: string, elementType: TypeAndSubType): ElementRef {
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

        const diagram = get(elementsAtom(diagramId)) as ClassDiagramState;
        const updatedDiagram = {...diagram, notes: {...diagram.notes, [note.id]: note}};
        set(elementsAtom(diagramId), updatedDiagram)
        return note
    }

    if (elementType.type === ElementType.ClassNode || elementType.type === ElementType.DeploymentNode) {
        const defaultWidth = 100;
        const defaultHeight = 80;
        const diagramId = get(activeDiagramIdAtom);
        const customShape : CustomShape | undefined  = elementType.subType?
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

function deleteSelectedElement(diagram: Draft<StructureDiagramState>, element: ElementRef,
                               getElement: (id: Id) => DiagramElement,
                               setElement: (id: Id, element: DiagramElement) => void) {
    switch(element.type) {
        case ElementType.Note:
            delete diagram.notes[element.id];
            setElement(element.id, emptyElementSentinel);
            break;

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


export function handleStructureElementCommand(get: Get, set: Set, elements: ElementRef[], command: Command) {
    const diagramId = get(activeDiagramIdAtom)
    const diagram = get(elementsAtom(diagramId)) as ClassDiagramState;
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

export function handleStructureElementPropertyChanged(get: Get, set: Set, elements: ElementRef[], propertyName: string, value: any) {
    const diagramId = get(activeDiagramIdAtom)
    const originalDiagram = get(elementsAtom(diagramId)) as StructureDiagramState;

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
