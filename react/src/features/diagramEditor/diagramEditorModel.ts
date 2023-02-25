import {Coordinate, Diagram} from "../../common/model";
import {DiagramElement, ElementType, Id} from "../../package/packageModel";
import {atom, atomFamily, selectorFamily} from "recoil";
import {elements} from "../demo";
import {nanoid} from 'nanoid';

export interface Linking {
    sourceElement: Id
    mouseStartPos: Coordinate
    diagramStartPos: Coordinate
    mousePos: Coordinate
    diagramPos: Coordinate

    drawing: boolean
    showLinkToNewDialog?: boolean
    targetElement?: Id
}

export interface MoveResize {
    element: Id
    mouseStartPos: Coordinate
    relativeStartPos: Coordinate
}

export interface Scrub {

}

export type DiagramId = Id;

export interface DiagramEditor {
    diagramId: Id
    diagramType: ElementType
    focusedElement?: Id
    selectedElements: Id[]
    linking?: Linking
    moveResize?: MoveResize
    snapGridSize: number
    scrub?: Scrub
}

export interface DiagramHandler {
    snapToElements(diagramPos: Coordinate, editor: DiagramEditor): Coordinate | undefined
}


export const elementsAtom = atomFamily<DiagramElement, Id>({
    key: 'elements',
    default: id => elements[id]
})

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

export const linkingAtom = atom<Linking>({
    key: 'linking',
    default: {} as Linking
})

export const selectedElementsAtom = atom<Id[]>({
    key: 'selectedElements',
    default: [],
})

export const snapGridSizeAtom = atom<number>({
    key: 'snapGridSize',
    default: 10,
})

export const generateId = (): string => {
    return nanoid(6);
}

export interface ConnectorRender {
    x: number;
    y: number;
    points: number[];
}



