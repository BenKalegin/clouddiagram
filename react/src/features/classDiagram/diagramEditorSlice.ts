import {createSlice, current, nanoid, PayloadAction} from '@reduxjs/toolkit'
import {Id} from "../../common/Model";
import {Bounds, Coordinate} from "../../common/Model";
import {ClassDiagramState, linkPlacement, LinkState, nodePlacementAfterResize, NodeState, portBounds} from "./model";
import {demoDiagramEditor} from "./demo";
import {RootState} from "../../app/store";

export interface DiagramEditor {
    diagram: Diagram;
}

export interface ClassDiagramEditor extends DiagramEditor {
    focusedElement?: Id;
    selectedElements: Id[];
    isNodePropsDialogOpen?: boolean;
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

interface DropFromPaletteAction {
    droppedAt: Coordinate;
}

const generateId = () : Id => {
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

export interface Diagram {
    metadata: DiagramMetadata
    content: ClassDiagramState
}

export interface DiagramEditors {
    activeIndex: number;
    editors: ClassDiagramEditor[];
}

const initialState: DiagramEditors = {
    activeIndex: 0,
    editors: [
        demoDiagramEditor("Demo Diagram 1"),
        demoDiagramEditor("Demo Diagram 2"),
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
            const diagram = editor.diagram.content;
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
        },

        nodeShowProperties: (state, action: PayloadAction<string>) => {
            state.editors[state.activeIndex].isNodePropsDialogOpen = true;
        },

        nodeCloseProperties: (state, action: PayloadAction<boolean>) => {
            state.editors[state.activeIndex].isNodePropsDialogOpen = false;
        },

        dropFromPalette: (state, action: PayloadAction<DropFromPaletteAction>) => {
            const id = generateId();
            const defaultWidth = 100;
            const defaultHeight = 80;
            const diagram = state.editors[state.activeIndex].diagram.content;
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
        },
        openDiagramActivated: (state, action: PayloadAction<number>) => {
            state.activeIndex = action.payload
        }
    }
})

export const {nodeResize, nodeSelect, nodeDeselect, nodeShowProperties, nodeCloseProperties, dropFromPalette, openDiagramActivated} = diagramEditorSlice.actions

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
export const selectDiagramEditor = (state: RootState) => state.diagramEditor.editors[state.diagramEditor.activeIndex];

export default diagramEditorSlice.reducer
