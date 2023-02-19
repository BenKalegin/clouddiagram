import {Bounds, Coordinate, zeroCoordinate} from "../../common/model";
import {elementsAtom} from "./diagramEditorModel";
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


export interface ElementSelectAction {
    id: Id
    shiftKey: boolean
    ctrlKey: boolean
}

export interface StartLinkingAction {
    elementId: Id
    mousePos: Coordinate
    relativePos: Coordinate
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

export interface linkToNewDialogCompleted {
    success: boolean
    selectedKey?: string;
    selectedName?: string;
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

export function screenToCanvas(e: KonvaEventObject<DragEvent>) {
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

// const startLinking1 = (editor: WritableDraft<DiagramEditor>, action: PayloadAction<StartLinkingAction>) => {
//     editor.linking = {
//         sourceElement: action.payload.elementId,
//         mouseStartPos: action.payload.mousePos,
//         relativeStartPos: action.payload.relativePos,
//         mousePos: action.payload.mousePos,
//         diagramPos: action.payload.relativePos,
//         targetElement: undefined,
//         drawing: true,
//         showLinkToNewDialog: false
//     }
// }

// const continueLinking1 = (editorDraft: WritableDraft<DiagramEditor>, action: PayloadAction<DrawLinkingAction>) => {
//     const editor = current(editorDraft)
//     const handler = getHandlerByType(editor.diagramType)
//
//     const linking = editor.linking!;
//     // we have a chance to receive continueLinking after endLinking, ignore it
//     if (!linking)
//         return
//     const diagramPos = toDiagramPos(linking, action.payload.mousePos);
//
//     const newPos = handler.snapToElements(diagramPos, editor)
//
//     if (!newPos) {
//         newPos = snapToGrid(diagramPos, editor.snapGridSize)
//     }
//
//     linking.mousePos = action.payload.mousePos;
//
//
//
//
//     // TODO unify with classDiagramSlice
//     // we have a chance to receive continueLinking after endLinking, ignore it
//     let snapped: Coordinate | undefined = undefined
//     if (!snapped)
//         snapped = snapToGrid(diagramPos, editor.snapGridSize);
//     linking.diagramPos = snapped
//     linking.mousePos = action.payload.mousePos;
// }

// const startMoveResize1 = (editor: WritableDraft<DiagramEditor>, action: PayloadAction<MoveResizeAction>) => {
//     editor.moveResize = {
//         element: action.payload.elementId,
//         mouseStartPos: action.payload.mousePos,
//         relativeStartPos: action.payload.relativePos,
//     }
// }

// const continueNodeResize1 = (editor: WritableDraft<DiagramEditor>, action: PayloadAction<MoveResizeAction>) => {
// }

// const endNodeResize1 = (editor: WritableDraft<DiagramEditor>, action: PayloadAction<MoveResizeAction>) => {
// }
//
// const endLinking1 = (editor: WritableDraft<DiagramEditor>) => {
//     editor.linking!.drawing = false;
// }
//
// const linkToNewDialog1 = (editor: WritableDraft<DiagramEditor>) => {
//     editor.linking!.showLinkToNewDialog = true
// }
//
// const linkToNewDialogClose1 = (editor: WritableDraft<DiagramEditor>, action: PayloadAction<linkToNewDialogCompleted>) => {
// }
//
// const stopLinking1 =  (editor: WritableDraft<DiagramEditor>) => {
//     editor.linking = undefined
// }


// const scrubCaptureOperation1 = (editor: WritableDraft<DiagramEditor>, action: PayloadAction<Diagram>) => {
//     // todo restore state
//     editor.scrub = undefined
// }
//
// export function toDiagramPos(linking: Linking, screenPos: Coordinate) : Coordinate {
//     return {
//         x: screenPos.x - linking.mouseStartPos.x + linking.relativeStartPos.x,
//         y: screenPos.y - linking.mouseStartPos.y + linking.relativeStartPos.y
//     }
// }
//
// const initialState: DiagramEditor = {
//     diagramId: "",
//     snapGridSize: 5,
//     selectedElements: []
// }

// export const diagramEditorSlice = createSlice({
//     name: 'diagramEditor',
//     initialState,
//     reducers: {
//         nodeDeselect: nodeDeselect1,
//         nodeSelect: nodeSelect1,
//         startLinking: startLinking1,
//         endLinking: endLinking1,
//         linkToNewDialog: linkToNewDialog1,
//         linkToNewDialogClose: linkToNewDialogClose1,
//         stopLinking: stopLinking1,
//         startNodeResize: startMoveResize1,
//         continueNodeResize: continueNodeResize1,
//         endNodeResize: endNodeResize1,
//         restoreDiagram: scrubCaptureOperation1,
//         continueLinking: continueLinking1
//     }
// })


