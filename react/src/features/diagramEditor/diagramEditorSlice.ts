import {Bounds, Coordinate, zeroCoordinate} from "../../common/model";
import {elementsAtom, Linking, linkingAtom, snapGridSizeAtom} from "./diagramEditorModel";
import {ElementType, Id} from "../../package/packageModel";
import {RecoilState, RecoilValue, useRecoilTransaction_UNSTABLE} from "recoil";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";
import {handleClassDiagramAction} from "../classDiagram/classDiagramSlice";
import {Action, createAction} from "@reduxjs/toolkit";
import {handleSequenceDiagramAction} from "../sequenceDiagram/sequenceDiagramSlice";
import Konva from "konva";
import KonvaEventObject = Konva.KonvaEventObject;

export type Get = (<T>(a: RecoilValue<T>) => T)
export type Set = (<T>(s: RecoilState<T>, u: (((currVal: T) => T) | T)) => void)

export enum ElementMoveResizePhase {
    start  = "start",
    move   = "move",
    end    = "end",
}
export const elementMoveAction = createAction<{
    elementId: Id
    phase: ElementMoveResizePhase
    currentPointerPos: Coordinate
    startPointerPos: Coordinate
    startNodePos: Coordinate
}>("editor/elementMove")

export const elementResizeAction = createAction<{
    elementId: Id
    phase: ElementMoveResizePhase
    suggestedBounds: Bounds
}>("editor/elementResize")

export const dropFromPaletteAction = createAction<{
    droppedAt: Coordinate;
    name: string
}>("editor/dropFromPalette");

export enum DialogOperation {
    open = "open",
    save = "save",
    cancel = "cancel",
}
export const propertiesDialogAction = createAction<{
    elementId: Id
    dialogResult: DialogOperation
}>("editor/showProperties");

export enum LinkingPhase {
    start  = "start",
    draw   = "draw",
    end    = "end",
}

export const linkingAction = createAction<{
    elementId: Id
    mousePos: Coordinate
    diagramPos: Coordinate | undefined
    phase: LinkingPhase
    ctrlKey: boolean
    shiftKey: boolean
}>('editor/startLinking');


export const linkToNewDialogCompletedAction = createAction<{
    success: boolean
    selectedKey?: string;
    selectedName?: string;
}>('editor/linkToNewDialogCompleted');


export interface ElementSelectAction {
    id: Id
    shiftKey: boolean
    ctrlKey: boolean
}

export interface MoveResizeAction {
    elementId: Id
    mousePos: Coordinate
    relativePos: Coordinate
}

export interface DrawLinkingAction {
    elementId: Id
    mousePos: Coordinate
    shiftKey: boolean
    ctrlKey: boolean
}

export interface AddNodeAndConnectAction {
    name: string
}

export function useDispatch() {
    return useRecoilTransaction_UNSTABLE(
        ({get, set}) => (action: Action) => {
            handleAction(action, get, set);
        },
        []
    )

}

function handleAction(action: Action, get: Get, set: Set) {
    const activeDiagramId = get(activeDiagramIdAtom);

    if (linkingAction.match(action)) {
        const {mousePos, diagramPos, elementId, phase } = action.payload;
        handleLinking(get, set, elementId, mousePos, diagramPos, phase);
    }

    const diagramKind = get(elementsAtom(activeDiagramId)).type;
    switch (diagramKind) {
        case ElementType.ClassDiagram:
            handleClassDiagramAction(action, get, set);
            break;

        case ElementType.SequenceDiagram:
            handleSequenceDiagramAction(action, get, set);
            break;
    }

}

export function screenToCanvas(e: KonvaEventObject<DragEvent | MouseEvent>) {
    const stage = e.target.getStage()?.getPointerPosition() ?? zeroCoordinate;
    return {x: stage.x, y: stage.y};
}



// const nodeDeselect1 = (editor: WritableDraft<DiagramEditor>) => {
//     editor.selectedElements = [];
//     editor.focusedElement = undefined;
//     editor.linking = undefined;
// };

// const nodeSelect1 = (editor: WritableDraft<DiagramEditor>, action: PayloadAction<ElementSelectAction>) => {
//     const append = action.payload.shiftKey || action.payload.ctrlKey
//     let selectedIds = editor.selectedElements;
//     const id = action.payload.id
//     if (!append) {
//         selectedIds = [id]
//     } else {
//         if (!editor.selectedElements.includes(id)) {
//             selectedIds.push(id)
//         } else
//             selectedIds = selectedIds.filter(e => e !== id)
//     }
//
//     editor.selectedElements = selectedIds;
//     editor.focusedElement = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : undefined
// };

const snapToGrid = (pos: Coordinate, gridSize: number) => {
    const x = Math.round(pos.x / gridSize) * gridSize;
    const y = Math.round(pos.y / gridSize) * gridSize;
    return {x, y}
}

export function toDiagramPos(linking: Linking, screenPos: Coordinate) : Coordinate {
    return {
        x: screenPos.x - linking.mouseStartPos.x + linking.diagramStartPos.x,
        y: screenPos.y - linking.mouseStartPos.y + linking.diagramStartPos.y
    }
}

function snapToElements(diagramPos: Coordinate): Coordinate | undefined {
    return undefined;
}

const handleLinking = (get: Get, set: Set, elementId: Id, mousePos: Coordinate, diagramPos: Coordinate | undefined, phase: LinkingPhase) => {
    if (phase === LinkingPhase.start) {
        set(linkingAtom, {
            sourceElement: elementId,
            mouseStartPos: mousePos,
            diagramStartPos: diagramPos!,
            mousePos: mousePos,
            diagramPos: diagramPos!,
            targetElement: undefined,
            drawing: true,
            showLinkToNewDialog: false
        })
    }else if (phase === LinkingPhase.draw) {

        const linking = get(linkingAtom);
        // we have a chance to receive continueLinking after endLinking, ignore it
        if (!linking)
            return

        const diagramPos = toDiagramPos(linking, mousePos)
        let snapped = snapToElements(diagramPos)

        if (!snapped) {
            snapped = snapToGrid(diagramPos, get(snapGridSizeAtom))
        }

        set(linkingAtom, {...linking, mousePos: mousePos, diagramPos: snapped})
    }else if (phase === LinkingPhase.end) {
        const linking = get(linkingAtom);
        set(linkingAtom, {...linking!, drawing: false, showLinkToNewDialog: true})
    }
}

// const startMoveResize1 = (editor: WritableDraft<DiagramEditor>, action: PayloadAction<MoveResizeAction>) => {
//     editor.moveResize = {
//         element: action.payload.elementId,
//         mouseStartPos: action.payload.mousePos,
//         relativeStartPos: action.payload.relativePos,
//     }
// }


// const scrubCaptureOperation1 = (editor: WritableDraft<DiagramEditor>, action: PayloadAction<Diagram>) => {
//     // todo restore state
//     editor.scrub = undefined
// }
//
//


