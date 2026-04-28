import {Bounds, Coordinate, defaultDiagramDisplay, Diagram} from "../../common/model";
import {DiagramElement, ElementType, Id, ElementRef} from "../../package/packageModel";
import {atom, Atom} from "jotai";
import {atomFamily} from "jotai-family";
import {persistentAtom, persistentAtomFamily} from "../../common/state/persistentAtoms";
import {elements} from "../demo";
import {nanoid} from 'nanoid';
import {diagramEditors} from "./diagramEditorSlice";
import {ExportImportFormat} from "../export/exportFormats";

export interface Linking {
    sourceElement: Id
    mouseStartPos: Coordinate
    diagramStartPos: Coordinate
    mousePos: Coordinate
    diagramPos: Coordinate
    scale: number

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

export const diagramTitleSelector = atomFamily((id: DiagramId | undefined): Atom<string | undefined> =>
    atom((get) => {
        if (!id)
            return "New diagram";
        const diagram = get(elementsAtom(id)) as Diagram;
        return diagram ? diagram.title : "Unknown " + id;
    })
);

export const diagramKindSelector = atomFamily((id: DiagramId): Atom<ElementType> =>
    atom((get) => get(elementsAtom(id)).type)
);

export const diagramDisplaySelector = atomFamily((id: DiagramId): Atom<Diagram['display']> =>
    atom((get) => (get(elementsAtom(id)) as Diagram).display ?? defaultDiagramDisplay)
);

export const selectedRefsSelector = atomFamily((id: DiagramId): Atom<ElementRef[]> =>
    atom((get) => (get(elementsAtom(id)) as Diagram).selectedElements ?? [])
);

export const selectedElementsSelector = atomFamily((diagramId: DiagramId): Atom<ElementRef[]> =>
    atom((get) => {
        const diagram = get(elementsAtom(diagramId)) as Diagram;
        const refs = diagram.selectedElements || [];
        const diagramEditor = diagramEditors[diagram.type];
        return refs.map(ref => {
            if (ref.type === ElementType.Note)
                return diagram.notes[ref.id];
            return diagramEditor.getElement(get, ref, diagram);
        });
    })
);

export const linkingAtom = atom<Linking | undefined>(undefined);
export const exportingAtom = atom<Exporting | undefined>(undefined);
export const importingAtom = atom<Importing | undefined>(undefined);
export const showContextAtom = atom<ContextPopupProps | undefined>(undefined);
export const snapGridSizeAtom = atom<number>(10);

export const generateId = (): string => {
    return nanoid(6);
}

export interface ConnectorRender {
    bounds: Bounds
    points: number[];
}

export const elementsAtom = persistentAtomFamily<DiagramElement, Id>(
    "element",
    (id) => elements[id] ?? emptyElementSentinel,
    (id) => id
);

// Track all element IDs for recovery
export const elementIdsAtom = persistentAtom<Id[]>("elementIds", Object.keys(elements));
