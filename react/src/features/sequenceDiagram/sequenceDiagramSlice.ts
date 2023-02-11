import {Action} from "@reduxjs/toolkit";
import {RecoilState, RecoilValue} from "recoil";
import {dropFromPaletteAction, elementMoveAction, elementResizeAction} from "../diagramEditor/diagramEditorSlice";
import {handleSequenceDropFromLibrary, handleSequenceMoveElement, handleSequenceResizeElement} from "./model";


export function handleSequenceDiagramAction(action: Action, get: <T>(a: RecoilValue<T>) => T, set: <T>(s: RecoilState<T>, u: (((currVal: T) => T) | T)) => void) {
    if (dropFromPaletteAction.match(action)) {
        const {name, droppedAt} = action.payload;
        handleSequenceDropFromLibrary(get, set, droppedAt, name);
    }
    else if (elementMoveAction.match(action)) {
        const {currentPointerPos, phase, startNodePos, startPointerPos, elementId} = action.payload;
        handleSequenceMoveElement(get, set, phase, elementId, currentPointerPos, startPointerPos, startNodePos);
    }
    else if (elementResizeAction.match(action)) {
        const {phase, elementId, suggestedBounds} = action.payload;
        handleSequenceResizeElement(get, set, phase, elementId, suggestedBounds);
    }
}

// export const sequenceDiagramSlice = createSlice({
//     name: 'sequenceDiagramEditor',
//     initialState,
//     reducers: {
//
//         connectExisting: (editor) => {
//             const linking = current(editor).linking!
//             autoConnectActivations(editor.diagram, linking.sourceElement, linking.targetElement!, 10);
//         },
//
//         continueLinking: (editor, action: PayloadAction<DrawLinkingAction>) => {
//             // // TODO unify with classDiagramSlice
//             // const linking = editor.linking!;
//             // // we have a chance to receive continueLinking after endLinking, ignore it
//             // if (!linking)
//             //     return
//             // const diagramPos = toDiagramPos(linking, action.payload.mousePos);
//             //
//             // let snapped: Coordinate | undefined = undefined
//             // const targetActivation = findTargetActivation(current(editor).diagram.activations, diagramPos);
//             // linking.targetElement = targetActivation?.id;
//             // if (targetActivation) {
//             //     snapped = snapToBounds(diagramPos, targetActivation.placement);
//             // }
//             // if (!snapped)
//             //     snapped = snapToGrid(diagramPos, editor.snapGridSize);
//             // linking.diagramPos = snapped
//             // linking.mousePos = action.payload.mousePos;
//         },
//
//
//         restoreDiagram: (editor, action: PayloadAction<Diagram>) => {
//             editor.diagram = action.payload as SequenceDiagramState
//         },
//
//         addNodeAndConnect: (editor, action: PayloadAction<AddNodeAndConnectAction>) => {
//             const id = generateId()
//         },
//
//     },
// })

