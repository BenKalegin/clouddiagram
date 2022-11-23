import {createSlice, current, nanoid, PayloadAction} from '@reduxjs/toolkit'
import {Id} from "../../common/Model";
import {Bounds, Coordinate} from "../../common/Model";
import {ClassDiagramState, linkPlacement, LinkState, nodePlacementAfterResize, NodeState, portBounds} from "./model";
import {demoClassDiagramEditor, demoSequenceDiagramEditor} from "../demo";
import {RootState} from "../../app/store";
import {SequenceDiagramState} from "../sequenceDiagram/model";

export enum DiagramEditorType {
    Class,
    Sequence
}

export interface ClassDiagramEditor {
    type: DiagramEditorType.Class
    diagram: ClassDiagramState
    focusedElement?: Id;
    selectedElements: Id[];
    isNodePropsDialogOpen?: boolean;
}

export interface SequenceDiagramEditor {
    type: DiagramEditorType.Sequence
    diagram: SequenceDiagramState
    focusedElement?: Id;
    selectedElements: Id[];
}

interface NodeResizeAction {
    node: Id
    deltaBounds: Bounds
}

interface NodeSelectAction {
    node: NodeState
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
}

const generateId = (): Id => {
    return nanoid(6);
}

export enum DiagramType {
    Class,
    Sequence,
    Deployment
}

interface DiagramMetadata {
    title: string;
    // createdBy: string;
    // createdOn: Date;
    // diagramType: DiagramType;
    // version: string;
}

export type Diagram = ClassDiagramState | SequenceDiagramState


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

        nodeSelect: (state, action: PayloadAction<NodeSelectAction>) => {
            const editor = state.editors[state.activeIndex];
            const append = action.payload.shiftKey || action.payload.ctrlKey
            let selectedIds = editor.selectedElements;
            const nodeId = action.payload.node.id;
            if (!append) {
                selectedIds = [nodeId]
            } else {
                if (!editor.selectedElements.includes(nodeId)) {
                    selectedIds.push(nodeId)
                } else
                    selectedIds = selectedIds.filter(e => e !== nodeId)
            }

            editor.selectedElements = selectedIds;
            editor.focusedElement = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : undefined
        },

        nodeResize: (state, action: PayloadAction<NodeResizeAction>) => {
            const editor = state.editors[state.activeIndex];
            switch (editor.type) {
                case DiagramEditorType.Class:
                    const diagram = editor.diagram;
                    const node = diagram.nodes[action.payload.node];

                    const nodePlacement = nodePlacementAfterResize(node, action.payload.deltaBounds);
                    node.placement = nodePlacement;

                    const portAffected = node.ports.map(port => diagram.ports[port]);
                    const portPlacements: { [id: Id]: Bounds } = {};

                    portAffected.forEach(port => {
                        const bounds = portBounds(nodePlacement, port);
                        portPlacements[port.id] = bounds;
                        port.placement = bounds;
                    });

                    const links: { [id: Id]: LinkState } = current(diagram.links);
                    for (let link of Object.values(links)) {
                        const bounds1 = portPlacements[link.port1];
                        const bounds2 = portPlacements[link.port2];
                        if (bounds1 || bounds2) {
                            diagram.links[link.id].placement = linkPlacement(link,
                                diagram.ports[link.port1],
                                diagram.ports[link.port2]);
                        }
                    }
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
            const defaultWidth = 100;
            const defaultHeight = 80;
            const editor = state.editors[state.activeIndex];
            switch (editor.type) {
                case DiagramEditorType.Class:
                    const diagram = editor.diagram;
                    diagram.nodes[id] = {
                        id,
                        text: "New Node",
                        ports: [],
                        placement: {
                            x: action.payload.droppedAt.x - defaultWidth / 2,
                            y: action.payload.droppedAt.y,
                            width: defaultWidth,
                            height: defaultHeight
                        }
                    }
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
