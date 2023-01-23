import {Coordinate} from "../../common/model";
import {ElementType, Id} from "../../package/packageModel";
import {WritableDraft} from "immer/dist/internal";

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

export interface MoveResize {
    element: Id
    mouseStartPos: Coordinate
    relativeStartPos: Coordinate
}

export interface Scrub {

}

enum DiagramEditorKind {
    Class,
    Sequence
}

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



