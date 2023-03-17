import {Bounds, Coordinate, Diagram} from "../../common/model";
import {DiagramElement, ElementType, Id, IdAndKind} from "../../package/packageModel";
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
    targetElement?: IdAndKind
}

export interface MoveResize {
    element: Id
    mouseStartPos: Coordinate
    relativeStartPos: Coordinate
}

export interface Scrub {

}

export type DiagramId = Id;

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

export const selectedElementsSelector = selectorFamily<IdAndKind[], DiagramId>({
    key: 'selectedElements',
    get: (id) => ({get}) => (get(elementsAtom(id)) as Diagram).selectedElements ?? []
})


export const linkingAtom = atom<Linking | undefined>({
    key: 'linking',
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




