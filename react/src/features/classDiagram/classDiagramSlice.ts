import {createSlice, current, nanoid, PayloadAction} from '@reduxjs/toolkit'
import {Coordinate, Diagram, Id} from "../../common/model";
import {addNewElementAt, autoConnectNodes, ClassDiagramState, resizeNode} from "./model";
import {RootState} from "../../app/store";
import {snapToGrid} from "../../common/Geometry/snap";
import {
    AddNodeAndConnectAction,
    DrawLinkingAction,
    DropFromPaletteAction,
    ElementResizeAction,
    toDiagramPos
} from "../diagramEditor/diagramEditorSlice";
import {DiagramHandler} from "../diagramEditor/diagramEditorModel";

export interface ClassDiagramEditor extends BaseDiagramEditor {
    type: DiagramEditorType.Class
    diagram: ClassDiagramState
    isNodePropsDialogOpen?: boolean;
}

interface NodePropsChangedAction {
    save: boolean
    node: Id
    text: string
}

export const generateId = (): Id => {
    return nanoid(6);
}

const initialState: ClassDiagramEditor = {} as ClassDiagramEditor;
// noinspection JSUnusedLocalSymbols

export const classDiagramSlice = createSlice({
    name: 'classDiagramEditor',
    initialState,
    reducers: {
        nodeResize: (editor, action: PayloadAction<ElementResizeAction>) => {
                resizeNode(editor.diagram, action.payload.deltaBounds, action.payload.elementId)
        },

        nodeShowProperties: (editor) => {
            editor.isNodePropsDialogOpen = true;
        },

        nodeCloseProperties: (editor, action: PayloadAction<NodePropsChangedAction>) => {
            editor.isNodePropsDialogOpen = false;
            if (action.payload.save) {
                editor.diagram.nodes[action.payload.node].text = action.payload.text;
            }
        },

        dropFromPalette: (editor, action: PayloadAction<DropFromPaletteAction>) => {
            const id = generateId();
            addNewElementAt(editor.diagram, id, action.payload.droppedAt, action.payload.name);
        },


        continueLinking: (editor, action: PayloadAction<DrawLinkingAction>) => {
            // const linking = editor.linking!;
            // // we have a chance to receive continueLinking after endLinking, ignore it
            // if (!linking)
            //     return
            // const diagramPos = toDiagramPos(linking, action.payload.mousePos);
            //
            // linking.diagramPos = snapToGrid(diagramPos, editor.snapGridSize)
            // linking.mousePos = action.payload.mousePos;
        },


        addNodeAndConnect: (editor, action: PayloadAction<AddNodeAndConnectAction>) => {
            const id = generateId()
            const linking = current(editor).linking!
            const pos = linking.diagramPos
            addNewElementAt(editor.diagram, id, pos , action.payload.name);
            autoConnectNodes(editor.diagram, linking.sourceElement, id);
        },


        connectExisting: (editor) => {
            const linking = current(editor).linking!
            autoConnectNodes(editor.diagram, linking.sourceElement, linking.targetElement!);
        },

    }
})

export const {
    nodeResize,
    nodeShowProperties,
    nodeCloseProperties,
    dropFromPalette,
    continueLinking,
    restoreDiagram,
    addNodeAndConnect,
    connectExisting
} = classDiagramSlice.actions

export const selectClassDiagramEditor = (state: RootState): ClassDiagramEditor => state.classDiagramEditor;

export default classDiagramSlice.reducer


