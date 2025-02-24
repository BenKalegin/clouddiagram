import {Get, Set} from "../diagramEditor/diagramEditorSlice";
import {
    CustomShape,
    defaultNoteHeight,
    defaultNoteStyle,
    defaultNoteWidth, defaultShapeStyle,
    ElementRef,
    ElementType, NodeState, PictureLayout
} from "../../package/packageModel";
import {Bounds, Coordinate} from "../../common/model";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";
import {elementsAtom, generateId, Linking, linkingAtom, snapGridSizeAtom} from "../diagramEditor/diagramEditorModel";
import produce, {Draft} from "immer";
import {snapToGrid} from "../../common/Geometry/snap";
import {StructureDiagramState} from "./structureDiagramState";
import {autoConnectNodes, ClassDiagramState, NodePlacement} from "../classDiagram/classDiagramModel";
import {NoteState} from "../commonComponents/commonComponentsModel";
import {TypeAndSubType} from "../diagramTabs/HtmlDrop";

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
            shapeStyle: defaultNoteStyle,
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
            layout: PictureLayout.Top,
            pictureId: elementType.subType,
        }
        : undefined;

        const node: NodeState = {
            type: elementType.type,
            id: generateId(),
            text: name,
            ports: [],
            shapeStyle: defaultShapeStyle,
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

