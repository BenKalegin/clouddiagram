import {createSlice, current, nanoid, PayloadAction} from '@reduxjs/toolkit'
import {Id} from "../../common/Model";
import {Bounds, Coordinate} from "../../common/Model";
import {ClassDiagramState, linkPlacement, LinkState, nodePlacementAfterResize, NodeState, portBounds} from "./model";
import {getDefaultDiagramState} from "./demo";

export interface ClassDiagramViewState  {
    diagram: ClassDiagramState;
    focusedElement: Id | null;
    selectedElements: Id[];
}

const getDefaultDiagramViewState = (): ClassDiagramViewState => {
    return {
        diagram: getDefaultDiagramState(),
        selectedElements: [],
        focusedElement: null,
    };
};

const initialState: ClassDiagramViewState = getDefaultDiagramViewState();

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

export const classDiagramSlice = createSlice({
    name: 'classDiagram',
    initialState,
    reducers: {
        nodeDeselect: (state) => {
            state.selectedElements = [];
            state.focusedElement = null
        },

        nodeSelect: (state, action: PayloadAction<NodeSelectAction>) => {
            const append = action.payload.shiftKey || action.payload.ctrlKey
            let selectedIds = state.selectedElements;
            const nodeId = action.payload.node.id;
            if (!append) {
                selectedIds = [nodeId]
            } else {
                if (!state.selectedElements.includes(nodeId)) {
                    selectedIds.push(nodeId)
                } else
                    selectedIds = selectedIds.filter(e => e !== nodeId)
            }

            state.selectedElements = selectedIds;
            state.focusedElement = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null
        },

        nodeResize: (state, action: PayloadAction<NodeResizeAction>) => {
            const node = state.diagram.nodes[action.payload.node];

            const nodePlacement = nodePlacementAfterResize(node, action.payload.deltaBounds);
            node.placement = nodePlacement;

            const portAffected = node.ports.map(port => state.diagram.ports[port]);
            const portPlacements: { [id: Id]: Bounds } = {};

            portAffected.forEach(port => {
                const bounds = portBounds(nodePlacement, port);
                portPlacements[port.id] = bounds;
                port.placement = bounds;
            });

            const links: { [id: Id]: LinkState } = current(state.diagram.links);
            for (let link of Object.values(links)) {
                const bounds1 = portPlacements[link.port1];
                const bounds2 = portPlacements[link.port2];
                if (bounds1 || bounds2) {
                    state.diagram.links[link.id].placement = linkPlacement(link,
                        state.diagram.ports[link.port1],
                        state.diagram.ports[link.port2]);
                }
            }
        },

        dropFromPalette: ({diagram}, action: PayloadAction<DropFromPaletteAction>) => {
            const id = generateId();
            const defaultWidth = 100;
            const defaultHeight = 80;
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
})

export const {nodeResize, nodeSelect, nodeDeselect, dropFromPalette} = classDiagramSlice.actions

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
//export const selectNodes = (state: RootState) => state.diagram.Nodes;

export default classDiagramSlice.reducer
