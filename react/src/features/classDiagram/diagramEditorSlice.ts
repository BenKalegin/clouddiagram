import {createSlice, current, nanoid, PayloadAction} from '@reduxjs/toolkit'
import {Bounds, Coordinate, DiagramState, Id} from "../../common/Model";
import {ClassDiagramState, addNewElementAt, resizeNode, autoConnect} from "./model";
import {demoClassDiagramEditor, demoSequenceDiagramEditor} from "../demo";
import {RootState} from "../../app/store";
import {handleSequenceDropFromLibrary, resizeLifeline, SequenceDiagramState} from "../sequenceDiagram/model";

export enum DiagramEditorType {
    Class,
    Sequence
}

interface Linking {
    sourceElement: Id
    drawing: boolean
    mouseStartPos?: Coordinate
    relativeStartPos?: Coordinate
    mousePos?: Coordinate
    showLinkToNewDialog?: boolean
}

export interface BaseDiagramEditor {
    focusedElement?: Id
    selectedElements: Id[]
    linking?: Linking
}

export interface ClassDiagramEditor extends BaseDiagramEditor {
    type: DiagramEditorType.Class
    diagram: ClassDiagramState
    isNodePropsDialogOpen?: boolean;
}

export interface SequenceDiagramEditor extends BaseDiagramEditor{
    type: DiagramEditorType.Sequence
    diagram: SequenceDiagramState
}

interface ElementResizeAction {
    elementId: Id
    deltaBounds: Bounds
}

interface ElementSelectAction {
    id: Id
    shiftKey: boolean
    ctrlKey: boolean
}

interface NodePropsChangedAction {
    save: boolean
    node: Id
    text: string
}

interface DropFromPaletteAction {
    droppedAt: Coordinate;
    name: string
}

interface StartLinkingAction {
    elementId: Id
    mousePos: Coordinate
    relativePos: Coordinate
}

interface DrawLinkingAction {
    elementId: Id
    mousePos: Coordinate
    shiftKey: boolean
    ctrlKey: boolean
}

interface linkToNewDialogCompleted {
    success: boolean
    selectedKey?: string;
    selectedName?: string;
}

interface AddNodeAndConnectAction {
    name: string
}


export const generateId = (): Id => {
    return nanoid(6);
}

export type DiagramEditor = ClassDiagramEditor | SequenceDiagramEditor;

export interface DiagramEditors {
    activeIndex: number;
    editors: DiagramEditor[];
}

const initialState: DiagramEditors = {
    activeIndex: 0,
    editors: [
        demoClassDiagramEditor("Demo Class 1"),
        demoClassDiagramEditor("Demo Class 2"),
        demoSequenceDiagramEditor("Demo Sequence 1"),
    ]
}

// noinspection JSUnusedLocalSymbols
export const diagramEditorSlice = createSlice({
    name: 'diagramEditor',
    initialState,
    reducers: {
        nodeDeselect: (state) => {
            const editor = state.editors[state.activeIndex];
            editor.selectedElements = [];
            editor.focusedElement = undefined;
            editor.linking = undefined;
        },

        nodeSelect: (state, action: PayloadAction<ElementSelectAction>) => {
            const editor = state.editors[state.activeIndex];
            const append = action.payload.shiftKey || action.payload.ctrlKey
            let selectedIds = editor.selectedElements;
            const id = action.payload.id
            if (!append) {
                selectedIds = [id]
            } else {
                if (!editor.selectedElements.includes(id)) {
                    selectedIds.push(id)
                } else
                    selectedIds = selectedIds.filter(e => e !== id)
            }

            editor.selectedElements = selectedIds;
            editor.focusedElement = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : undefined
        },

        nodeResize: (state, action: PayloadAction<ElementResizeAction>) => {
            const editor = state.editors[state.activeIndex];
            switch (editor.type) {
                case DiagramEditorType.Class:
                    resizeNode(editor.diagram, action.payload.deltaBounds, action.payload.elementId)
                    break
                case DiagramEditorType.Sequence:
                    resizeLifeline(editor.diagram, action.payload.deltaBounds, action.payload.elementId);
                    break;
                default:
                    break;
            }
        },

        nodeShowProperties: (state) => {
            const editor = state.editors[state.activeIndex];
            switch (editor.type) {
                case DiagramEditorType.Class:
                    editor.isNodePropsDialogOpen = true;
            }
        },

        nodeCloseProperties: (state, action: PayloadAction<NodePropsChangedAction>) => {
            const editor = state.editors[state.activeIndex];
            switch (editor.type) {
                case DiagramEditorType.Class:

                    editor.isNodePropsDialogOpen = false;
                    if (action.payload.save) {
                        editor.diagram.nodes[action.payload.node].text = action.payload.text;
                    }
            }
        },

        dropFromPalette: (state, action: PayloadAction<DropFromPaletteAction>) => {
            const id = generateId();
            const editor = state.editors[state.activeIndex];
            switch (editor.type) {
                case DiagramEditorType.Class:
                    addNewElementAt(editor.diagram, id, action.payload.droppedAt, action.payload.name);
                    break;
                case DiagramEditorType.Sequence:
                    handleSequenceDropFromLibrary(editor.diagram, id, action.payload.droppedAt, action.payload.name);
                    break;

            }
        },
        openDiagramActivated: (state, action: PayloadAction<number>) => {
            state.activeIndex = action.payload
        },

        startLinking: (state, action: PayloadAction<StartLinkingAction>) => {
            const editor = state.editors[state.activeIndex];
            editor.linking = {
                sourceElement: action.payload.elementId,
                mouseStartPos: action.payload.mousePos,
                relativeStartPos: action.payload.relativePos,
                mousePos: action.payload.mousePos,
                drawing: true
            }
        },

        continueLinking: (state, action: PayloadAction<DrawLinkingAction>) => {
            const editor = state.editors[state.activeIndex];
            editor.linking!.mousePos = action.payload.mousePos;
        },

        endLinking: (state) => {
            const editor = state.editors[state.activeIndex];
            editor.linking!.drawing = false;
        },

        linkToNewDialog: (state) => {
            const editor = state.editors[state.activeIndex]
            editor.linking!.showLinkToNewDialog = true
        },

        linkToNewDialogClose: (state, action: PayloadAction<linkToNewDialogCompleted>) => {
        },

        addNodeAndConnect: (state, action: PayloadAction<AddNodeAndConnectAction>) => {
            const editor = state.editors[state.activeIndex]
            const id = generateId()
            switch (editor.type) {
                case DiagramEditorType.Class:
                    const linking = editor.linking!;
                    const pos = {
                        x: linking.mousePos!.x - linking.mouseStartPos!.x + linking.relativeStartPos!.x,
                        y: linking.mousePos!.y - linking.mouseStartPos!.y + linking.relativeStartPos!.y
                    }
                    addNewElementAt(editor.diagram, id, pos , action.payload.name);
                    autoConnect(editor.diagram, current(editor).linking!.sourceElement, id);

                    break;
                case DiagramEditorType.Sequence:
                    break;
            }
        },

        stopLinking: (state) => {
            const editor = state.editors[state.activeIndex]
            editor.linking = undefined
        },

        restoreDiagram: (state, action: PayloadAction<DiagramState>) => {
            const editor = state.editors[state.activeIndex]
            switch (editor.type) {
                case DiagramEditorType.Class:
                    editor.diagram = action.payload as ClassDiagramState
                    break;
                case DiagramEditorType.Sequence:
                    editor.diagram = action.payload as SequenceDiagramState
                    break;
            }
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
    openDiagramActivated,
    startLinking,
    continueLinking,
    endLinking,
    linkToNewDialog,
    linkToNewDialogClose,
    restoreDiagram,
    stopLinking,
    addNodeAndConnect
} = diagramEditorSlice.actions

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
export const selectDiagramEditor = (state: RootState) => state.diagramEditor.editors[state.diagramEditor.activeIndex];

export const selectClassDiagramEditor = (state: RootState): ClassDiagramEditor => {
  const editor = selectDiagramEditor(state)
    if (editor.type === DiagramEditorType.Class)
        return editor
    throw new Error("Class diagram expected, but found " + editor.type)
};

export const selectSequenceDiagramEditor = (state: RootState): SequenceDiagramEditor => {
  const editor = selectDiagramEditor(state)
    if (editor.type === DiagramEditorType.Sequence)
        return editor
    throw new Error("Class diagram expected, but found " + editor.type)
};

export default diagramEditorSlice.reducer
