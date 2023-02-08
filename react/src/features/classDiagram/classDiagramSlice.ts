import {Id} from "../../package/packageModel";
import {RecoilState, RecoilValue} from "recoil";
import {dropFromPaletteAction} from "../diagramEditor/diagramEditorSlice";
import {nanoid} from 'nanoid';
import {addNewElementAt} from "./model";
import {Action, createReducer} from "@reduxjs/toolkit";
// export interface ClassDiagramEditor extends BaseDiagramEditor {
//     type: DiagramEditorType.Class
//     diagram: ClassDiagramState
//     isNodePropsDialogOpen?: boolean;
// }

interface NodePropsChangedAction {
    save: boolean
    node: Id
    text: string
}


export const generateId = (): string => {
    return nanoid(6);
}


export function handleClassDiagramAction(action: Action, get: <T>(a: RecoilValue<T>) => T, set: <T>(s: RecoilState<T>, u: (((currVal: T) => T) | T)) => void) {
    if (dropFromPaletteAction.match(action)) {
        addNewElementAt(get, set, action.payload.droppedAt, action.payload.name);
    }
}


// eslint-disable-next-line react-hooks/rules-of-hooks
// export const handleDrop = useRecoilTransaction_UNSTABLE(
//     ({get, set}) => (action: DropFromPaletteAction) => {
//             addNewElementAt(get, set, action.droppedAt, action.name);
//     },
//     []
// )
//

//
// const initialState: ClassDiagramEditor = {} as ClassDiagramEditor;
// // noinspection JSUnusedLocalSymbols
//
// export const classDiagramSlice = createSlice({
//     name: 'classDiagramEditor',
//     initialState,
//     reducers: {
//         nodeResize: (editor, action: PayloadAction<ElementResizeAction>) => {
//                 resizeNode(editor.diagram, action.payload.deltaBounds, action.payload.elementId)
//         },
//
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

