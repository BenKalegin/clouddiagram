import {
    dropFromPaletteAction,
    elementMoveAction,
    elementResizeAction, Get, Set,
    propertiesDialogAction
} from "../diagramEditor/diagramEditorSlice";
import {addNewElementAt, moveElement, nodePropertiesDialog, resizeElement} from "./classDiagramModel";
import {Action} from "@reduxjs/toolkit";

export function handleClassDiagramAction(action: Action, get: Get, set: Set) {
    if (dropFromPaletteAction.match(action)) {
        addNewElementAt(get, set, action.payload.droppedAt, action.payload.name);
    }else if(elementMoveAction.match(action)){
        const {elementId, currentPointerPos, startNodePos, startPointerPos} = action.payload;
        moveElement(get, set, elementId, currentPointerPos, startPointerPos, startNodePos);
    }else if(elementResizeAction.match(action)){
        const {elementId, suggestedBounds} = action.payload;
        resizeElement(get, set, elementId, suggestedBounds);
    }else if(propertiesDialogAction.match(action)){
        const {elementId, dialogResult} = action.payload;
        nodePropertiesDialog(get, set, elementId, dialogResult);
    }
}


//
// const initialState: ClassDiagramEditor = {} as ClassDiagramEditor;
// // noinspection JSUnusedLocalSymbols
//
// export const classDiagramSlice = createSlice({
//     name: 'classDiagramEditor',
//     initialState,
//     reducers: {
//
//
//         continueLinking: (editor, action: PayloadAction<DrawLinkingAction>) => {
//             // const linking = editor.linking!;
//             // // we have a chance to receive continueLinking after endLinking, ignore it
//             // if (!linking)
//             //     return
//             // const diagramPos = toDiagramPos(linking, action.payload.mousePos);
//             //
//             // linking.diagramPos = snapToGrid(diagramPos, editor.snapGridSize)
//             // linking.mousePos = action.payload.mousePos;
//         },
//
//
//         addNodeAndConnect: (editor, action: PayloadAction<AddNodeAndConnectAction>) => {
//             const id = generateId()
//             const linking = current(editor).linking!
//             const pos = linking.diagramPos
//             addNewElementAt(editor.diagram, id, pos , action.payload.name);
//             autoConnectNodes(editor.diagram, linking.sourceElement, id);
//         },
//
//
//         connectExisting: (editor) => {
//             const linking = current(editor).linking!
//             autoConnectNodes(editor.diagram, linking.sourceElement, linking.targetElement!);
//         },
//
//     }
// })
//
// export const {
//     nodeResize,
//     nodeCloseProperties,
//     dropFromPalette,
//     continueLinking,
//     restoreDiagram,
//     addNodeAndConnect,
//     connectExisting
// } = classDiagramSlice.actions
//
// export const selectClassDiagramEditor = (state: RootState): ClassDiagramEditor => state.classDiagramEditor;
//
// export default classDiagramSlice.reducer

