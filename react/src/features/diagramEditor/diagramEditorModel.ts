import {Bounds, Coordinate, Diagram} from "../../common/model";
import {DiagramElement, ElementType, Id, ElementRef} from "../../package/packageModel";
import {atom, atomFamily, selectorFamily} from "recoil";
import {elements} from "../demo";
import {nanoid} from 'nanoid';
import {diagramEditors} from "./diagramEditorSlice";
import {ExportImportFormat} from "../export/exportFormats";
import { localStoragePersistence } from "../../common/persistence/statePersistence";

export interface Linking {
    sourceElement: Id
    mouseStartPos: Coordinate
    diagramStartPos: Coordinate
    mousePos: Coordinate
    diagramPos: Coordinate

    drawing: boolean
    showLinkToNewDialog?: boolean
    targetElement?: ElementRef
}

export type DiagramId = Id;


export enum ExportPhase {
    start,
    selected,
    exporting,
    cancel
}

export enum ImportPhase {
    start,
    selected,
    importing,
    cancel
}
export interface Exporting {
    phase: ExportPhase;
    format?: ExportImportFormat
}

export interface Importing {
    phase: ImportPhase;
    format?: ExportImportFormat
}

export interface ContextPopupProps {
    elementId: Id
    mousePos: Coordinate
    diagramPos: Coordinate
}

export const emptyElementSentinel: DiagramElement = {id: "", type: ElementType.ClassNode};

export const diagramTitleSelector = selectorFamily<string | undefined, DiagramId | undefined>({
    key: 'diagram',
    get: (id) => ({get}) => {
        if (!id)
            return "New diagram";
        const diagram = get(elementsAtom(id)) as Diagram;
        return diagram ? diagram.title : "Unknown " + id
    }
})

export const diagramKindSelector = selectorFamily<ElementType, DiagramId>({
    key: 'diagram',
    get: (id) => ({get}) => get(elementsAtom(id)).type
})

export const selectedRefsSelector = selectorFamily<ElementRef[], DiagramId>({
    key: 'selectedElements',
    get: (id) => ({get}) => (get(elementsAtom(id)) as Diagram).selectedElements ?? []
})

export const selectedElementsSelector = selectorFamily<ElementRef[], DiagramId>({
    key: 'selectedElements',
    get: (diagramId) => ({get}) => {
        const diagram = get(elementsAtom(diagramId)) as Diagram
        const refs = diagram.selectedElements || []
        const diagramEditor  = diagramEditors[diagram.type];
        return (refs.map(ref => {
            if (ref.type === ElementType.Note)
                return diagram.notes[ref.id];
            return diagramEditor.getElement(get, ref, diagram);
        }))
    }
})

export const linkingAtom = atom<Linking | undefined>({
    key: 'linking',
    default: undefined
})

export const exportingAtom = atom<Exporting | undefined>({
    key: 'exporting',
    default: undefined
})

export const importingAtom = atom<Importing | undefined>({
    key: 'importing',
    default: undefined
})

export const showContextAtom = atom< ContextPopupProps | undefined>({
    key: 'contextPopup',
    default: undefined
})

export const snapGridSizeAtom = atom<number>({
    key: 'snapGridSize',
    default: 10,
})

export const generateId = (): string => {
    return nanoid(6);
}

export interface ConnectorRender {
    bounds: Bounds
    points: number[];
}

export const elementsAtom = atomFamily<DiagramElement, Id>({
    key: 'elements',
    default: id => elements[id] ?? emptyElementSentinel,
    effects: id => [
        localStoragePersistence(`element_${id}`)
    ]
});

// Create a new atom to track all element IDs for recovery
export const elementIdsAtom = atom<Id[]>({
    key: 'elementIds',
    default: Object.keys(elements),
    effects: [
        localStoragePersistence('elementIds')
    ]
});


