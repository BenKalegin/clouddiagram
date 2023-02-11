import {Id} from "../../package/packageModel";
import {RecoilState, RecoilValue} from "recoil";
import {dropFromPaletteAction, elementMoveAction, elementResizeAction} from "../diagramEditor/diagramEditorSlice";
import {addNewElementAt, moveElement, resizeElement} from "./model";
import {Action} from "@reduxjs/toolkit";

interface NodePropsChangedAction {
    save: boolean
    node: Id
    text: string
}


export function handleClassDiagramAction(action: Action, get: <T>(a: RecoilValue<T>) => T, set: <T>(s: RecoilState<T>, u: (((currVal: T) => T) | T)) => void) {
    if (dropFromPaletteAction.match(action)) {
        addNewElementAt(get, set, action.payload.droppedAt, action.payload.name);
    }else if(elementMoveAction.match(action)){
        const {elementId, currentPointerPos, startNodePos, startPointerPos} = action.payload;
        moveElement(get, set, elementId, currentPointerPos, startPointerPos, startNodePos);
    }else if(elementResizeAction.match(action)){
        const {elementId, suggestedBounds} = action.payload;
        resizeElement(get, set, elementId, suggestedBounds);
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
//         nodeShowProperties: (editor) => {
//             editor.isNodePropsDialogOpen = true;
//         },
//
//         nodeCloseProperties: (editor, action: PayloadAction<NodePropsChangedAction>) => {
//             editor.isNodePropsDialogOpen = false;
//             if (action.payload.save) {
//                 editor.diagram.nodes[action.payload.node].text = action.payload.text;
//             }
//         },
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
//     nodeShowProperties,
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

