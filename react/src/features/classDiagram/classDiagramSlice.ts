import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import type {RootState} from '../../app/store'
import {DiagramElement} from "../../common/Model";
import {Bounds} from "./Models";

export enum PortAlignment {
  Left,
  Right,
  Top,
  Bottom,
}

export interface PortState extends DiagramElement {
  alignment: PortAlignment;
  /**
   * Percentage of edge wide where the port center is located, counting from left or top
   * For example, 50 for the top oriented is the center of the top edge
   */
  edgePosRatio: number

  /**
   * Percentage of the port going deep inside the node.
   * - 0 means the port is on the edge of the node pointing outward
   * - 50 means the half of port crosses the edge
   * - 100 means the port is sunk into the node
   */
  depthRatio: number

  /**
   * Width of the marker along the edge it belong to
   */
  latitude: number;

  /**
   * Height of the marker in perpendicular direction to the edge it belong to
   */
  longitude: number;
}

export interface NodeState extends DiagramElement {
  placement: Bounds;
  ports: PortState[];
}

export interface LinkState {
  port1: PortState;
  port2: PortState;
}

export interface ClassDiagramState {
  Nodes: NodeState[];
  Links: LinkState[];
}

export interface ClassDiagramViewState extends ClassDiagramState {
  focusedElementId: string | null;
  selectedElementIds: string[];
}

function getDefaultDiagramState(): ClassDiagramState {
  const port11: PortState = {
    id: "port1",
    edgePosRatio: 50,
    alignment: PortAlignment.Right,
    depthRatio: 50,
    latitude: 8,
    longitude: 8
  }

  const port12: PortState = {
    id: "port1",
    edgePosRatio: 50,
    alignment: PortAlignment.Top,
    depthRatio: 50,
    latitude: 8,
    longitude: 8
  }

  const port13: PortState = {
    id: "port1",
    edgePosRatio: 50,
    alignment: PortAlignment.Bottom,
    depthRatio: 50,
    latitude: 8,
    longitude: 8
  }

  const node1: NodeState = {
    id: "node1",
    ports: [
      port11,
      port12,
      port13
    ],
    placement: {
      y: 50,
      x: 50,
      width: 100,
      height: 80
    }
  };

  const port2: PortState = {
    id: "port1",
    edgePosRatio: 50,
    alignment: PortAlignment.Left,
    depthRatio: 50,
    latitude: 8,
    longitude: 8
  }

  const node2: NodeState = {
    id: "node2",
    ports: [
      port2,
    ],
    placement: {
      y: 300,
      x: 300,
      width: 100,
      height: 80
    }
  };

  return {
    Nodes: [node1, node2],
    Links: [{port1: port11, port2: port2}]
  };
}

const getDefaultDiagramViewState = (): ClassDiagramViewState => {
  const diagramState = getDefaultDiagramState();
  return {
    ...diagramState,
    selectedElementIds: [],
    focusedElementId: null,
  };
};

const updateStateAfterResize = ({placement}: NodeState, deltaBounds: Bounds) : Bounds => {
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
  node: NodeState
  deltaBounds: Bounds
}

export const classDiagramSlice = createSlice({
  name: 'classDiagram',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    nodeResize: (state, action: PayloadAction<NodeResizeAction>) => {
      const node = action.payload.node;
      state.Nodes[state.Nodes.indexOf(node)].placement = updateStateAfterResize(node, action.payload.deltaBounds);
    },
    changeSelection: (state, action: PayloadAction<string[]>) => {
      const selectedElementIds = action.payload;
      state.selectedElementIds = selectedElementIds;
      state.focusedElementId = selectedElementIds.length > 0 ? selectedElementIds[selectedElementIds.length-1] : null
    }
  },
})

export const { nodeResize, changeSelection } = classDiagramSlice.actions

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
export const selectNodes = (state: RootState) => state.diagram.Nodes;

export default classDiagramSlice.reducer

