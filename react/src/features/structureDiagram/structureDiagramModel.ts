import {Get, Set} from "../diagramEditor/diagramEditorSlice";
import {ElementRef, ElementType} from "../../package/packageModel";
import {Bounds, Coordinate} from "../../common/model";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";
import {elementsAtom, Linking, linkingAtom, snapGridSizeAtom} from "../diagramEditor/diagramEditorModel";
import produce, {Draft} from "immer";
import {snapToGrid} from "../../common/Geometry/snap";
import {StructureDiagramState} from "./structureDiagramState";
import {addNewElementAt, autoConnectNodes} from "../classDiagram/classDiagramModel";

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
    const node = addNewElementAt(get, set, pos, name, ElementType.ClassNode);
    autoConnectNodes(get, set, linking.sourceElement, node as ElementRef);
    set(linkingAtom, {...linking, showLinkToNewDialog: false } )
}



