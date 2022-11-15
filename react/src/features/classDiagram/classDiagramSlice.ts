import {createSlice, current, nanoid, PayloadAction} from '@reduxjs/toolkit'
import {Id} from "../../common/Model";
import {Bounds, Coordinate} from "../../common/Model";
import {ClassDiagramState, linkPlacement, LinkState, NodeState, PortAlignment, portBounds, PortState} from "./model";

const getDefaultDiagramState = (): ClassDiagramState => {
    const port11: PortState = {
        id: "port11",
        edgePosRatio: 50,
        alignment: PortAlignment.Right,
        depthRatio: 50,
        latitude: 8,
        longitude: 8,
        placement: {} as Bounds,
    }

    const port12: PortState = {
        id: "port12",
        edgePosRatio: 50,
        alignment: PortAlignment.Top,
        depthRatio: 50,
        latitude: 8,
        longitude: 8,
        placement: {} as Bounds,
    }

    const port13: PortState = {
        id: "port13",
        edgePosRatio: 50,
        alignment: PortAlignment.Bottom,
        depthRatio: 50,
        latitude: 8,
        longitude: 8,
        placement: {} as Bounds,
    }

    const node1: NodeState = {
        id: "node1",
        ports: [
            port11.id,
            port12.id,
            port13.id
        ],
        text: "Alice",
        placement: {
            y: 50,
            x: 50,
            width: 100,
            height: 80
        }
    };

    const port2: PortState = {
        id: "port21",
        edgePosRatio: 50,
        alignment: PortAlignment.Left,
        depthRatio: 50,
        latitude: 8,
        longitude: 8,
        placement: {} as Bounds,
    }

    const node2: NodeState = {
        id: "node2",
        ports: [
            port2.id,
        ],
        text: "Bob",
        placement: {
            y: 300,
            x: 300,
            width: 100,
            height: 80
        }
    };

    const nodes: { [id: Id]: NodeState } = {
        [node1.id]: node1,
        [node2.id]: node2
    }

    const ports: { [id: Id]: PortState } = {
        [port11.id]: port11,
        [port12.id]: port12,
        [port13.id]: port13,
        [port2.id]: port2
    }

    for (let node of Object.values(nodes)) {
        node.ports.map(portId => ports[portId].placement = portBounds(node.placement, ports[portId]!));
    }

    const link1: LinkState = {
        port1: port11.id,
        port2: port2.id,
        placement: {svgPath: []},
        id: "link1"
    };

    const links: { [id: Id]: LinkState } = {
        [link1.id]: link1
    }

    for (let link of Object.values(links)) {
        link.placement = linkPlacement(link, ports[link.port1], ports[link.port2]);
    }

    return {
        nodes,
        links,
        ports
    };
};

export interface ClassDiagramViewState extends ClassDiagramState {
    focusedElement: Id | null;
    selectedElements: Id[];
}

const getDefaultDiagramViewState = (): ClassDiagramViewState => {
    const diagramState = getDefaultDiagramState();
    return {
        ...diagramState,
        selectedElements: [],
        focusedElement: null,
    };
};

const nodePlacementAfterResize = ({placement}: NodeState, deltaBounds: Bounds): Bounds => {
    return {
        x: placement.x + deltaBounds.x,
        y: placement.y + deltaBounds.y,
        // set minimal value
        width: Math.max(5, placement.width + deltaBounds.width),
        height: Math.max(5, placement.height + deltaBounds.height)
    }
}


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
            const node = state.nodes[action.payload.node];

            const nodePlacement = nodePlacementAfterResize(node, action.payload.deltaBounds);
            node.placement = nodePlacement;

            const portAffected = node.ports.map(port => state.ports[port]);
            const portPlacements: { [id: Id]: Bounds } = {};

            portAffected.forEach(port => {
                const bounds = portBounds(nodePlacement, port);
                portPlacements[port.id] = bounds;
                port.placement = bounds;
            });

            const links: { [id: Id]: LinkState } = current(state.links);
            for (let link of Object.values(links)) {
                const bounds1 = portPlacements[link.port1];
                const bounds2 = portPlacements[link.port2];
                if (bounds1 || bounds2) {
                    state.links[link.id].placement = linkPlacement(link,
                        state.ports[link.port1],
                        state.ports[link.port2]);
                }
            }
        },

        dropFromPalette: (state, action: PayloadAction<DropFromPaletteAction>) => {
            const id = generateId();
            const defaultWidth = 100;
            const defaultHeight = 80;
            state.nodes[id] = {
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

