import {Coordinate, Id} from "../../common/model";

export interface Linking {

    sourceElement: Id
    mouseStartPos: Coordinate
    relativeStartPos: Coordinate
    mousePos: Coordinate
    diagramPos: Coordinate

    drawing: boolean
    showLinkToNewDialog?: boolean
    targetElement?: Id
}

export interface BaseDiagramEditor {
    focusedElement?: Id
    selectedElements: Id[]
    linking?: Linking
    snapGridSize: number
}

export enum DiagramEditorType {
    Class,
    Sequence
}

