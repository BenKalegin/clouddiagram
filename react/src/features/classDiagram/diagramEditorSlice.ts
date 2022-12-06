import {createSlice, nanoid, PayloadAction} from '@reduxjs/toolkit'
import {Id} from "../../common/Model";
import {Bounds, Coordinate} from "../../common/Model";
import {ClassDiagramState, handleClassDropFromLibrary, resizeNode} from "./model";
import {demoClassDiagramEditor, demoSequenceDiagramEditor} from "../demo";
import {RootState} from "../../app/store";
import {handleSequenceDropFromLibrary, resizeLifeline, SequenceDiagramState} from "../sequenceDiagram/model";

export enum DiagramEditorType {
    Class,
    Sequence
}

export interface ClassDiagramEditor {
    type: DiagramEditorType.Class
    diagram: ClassDiagramState
    focusedElement?: Id;
    selectedElements: Id[];
    linkingElement?: Id;
    isNodePropsDialogOpen?: boolean;
}

export interface SequenceDiagramEditor {
    type: DiagramEditorType.Sequence
    diagram: SequenceDiagramState
    focusedElement?: Id;
    selectedElements: Id[];
    linkingElement?: Id;
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

const generateId = (): Id => {
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


export const diagramEditorSlice = createSlice({
    name: 'diagramEditor',
    initialState,
    reducers: {
        nodeDeselect: (state) => {
            const editor = state.editors[state.activeIndex];
            editor.selectedElements = [];
            editor.focusedElement = undefined;
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
                    handleClassDropFromLibrary(editor.diagram, id, action.payload.droppedAt, action.payload.name);
                    break;
                case DiagramEditorType.Sequence:
                    handleSequenceDropFromLibrary(editor.diagram, id, action.payload.droppedAt, action.payload.name);
                    break;

            }
        },
        openDiagramActivated: (state, action: PayloadAction<number>) => {
            state.activeIndex = action.payload
        }
    }
})

export const {
    nodeResize,
    nodeSelect,
    nodeDeselect,
    nodeShowProperties,
    nodeCloseProperties,
    dropFromPalette,
    openDiagramActivated
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
