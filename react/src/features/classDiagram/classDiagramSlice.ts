import {createSlice, current, nanoid, PayloadAction} from '@reduxjs/toolkit'
import {DiagramState, Id} from "../../common/model";
import {addNewElementAt, autoConnectNodes, ClassDiagramState, resizeNode} from "./model";
import {RootState} from "../../app/store";
import {snapToGrid} from "../../common/Geometry/snap";
import {
    AddNodeAndConnectAction,
    DrawLinkingAction,
    DropFromPaletteAction,
    ElementResizeAction,
    endLinking1,
    linkToNewDialog1,
    linkToNewDialogClose1,
    nodeDeselect1,
    nodeSelect1,
    startLinking1,
    stopLinking1,
    toDiagramPos
} from "../baseDiagram/baseSlice";
import {BaseDiagramEditor, DiagramEditorType} from "../baseDiagram/baseDiagramModel";

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
        nodeDeselect: nodeDeselect1,
        nodeSelect: nodeSelect1,

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

        startLinking: startLinking1,

        continueLinking: (editor, action: PayloadAction<DrawLinkingAction>) => {
            const linking = editor.linking!;
            // we have a chance to receive continueLinking after endLinking, ignore it
            if (!linking)
                return
            const diagramPos = toDiagramPos(linking, action.payload.mousePos);

            linking.diagramPos = snapToGrid(diagramPos, editor.snapGridSize)
            linking.mousePos = action.payload.mousePos;
        },

        endLinking: endLinking1,

        linkToNewDialog: linkToNewDialog1,

        linkToNewDialogClose: linkToNewDialogClose1,

        addNodeAndConnect: (editor, action: PayloadAction<AddNodeAndConnectAction>) => {
            const id = generateId()
            const linking = current(editor).linking!
            const pos = linking.diagramPos
            addNewElementAt(editor.diagram, id, pos , action.payload.name);
            autoConnectNodes(editor.diagram, linking.sourceElement, id);
        },

        stopLinking: stopLinking1,

        connectExisting: (editor) => {
            const linking = current(editor).linking!
            autoConnectNodes(editor.diagram, linking.sourceElement, linking.targetElement!);
        },

        restoreDiagram: (editor, action: PayloadAction<DiagramState>) => {
            editor.diagram = action.payload as ClassDiagramState
        },
    }
})

export const {
    nodeResize,
    nodeSelect,
    nodeDeselect,
    nodeShowProperties,
    nodeCloseProperties,
    dropFromPalette,
    startLinking,
    continueLinking,
    endLinking,
    linkToNewDialog,
    linkToNewDialogClose,
    restoreDiagram,
    stopLinking,
    addNodeAndConnect,
    connectExisting
} = classDiagramSlice.actions

export const selectClassDiagramEditor = (state: RootState): ClassDiagramEditor => state.classDiagramEditor;

export default classDiagramSlice.reducer
