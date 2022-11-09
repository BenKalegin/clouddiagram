import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import type {RootState} from '../../app/store'
import {DiagramElement} from "../../common/Model";
import {Bounds, center, shift} from "./Models";
import {PathGenerators} from "../../common/Geometry/PathGenerator";

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

  placement: Bounds;
}

export interface NodeState extends DiagramElement {
  placement: Bounds;
  ports: PortState[];
}

export interface LinkPlacement {
  svgPath: string[];
}

export interface LinkState {
  placement: LinkPlacement;
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


const portBounds = (nodePlacement: Bounds, port: PortState): Bounds => {

  switch (port.alignment) {
    case PortAlignment.Top:
      return {
        x: nodePlacement.x + nodePlacement.width * port.edgePosRatio / 100 - port.latitude / 2,
        y: nodePlacement.y - port.longitude * (100 - port.depthRatio) / 100,
        width: port.latitude,
        height: port.longitude
      }
    case PortAlignment.Bottom:
      return {
        x: nodePlacement.x + nodePlacement.width * port.edgePosRatio / 100 - port.latitude / 2,
        y: nodePlacement.y + nodePlacement.height - port.longitude * port.depthRatio / 100,
        width: port.latitude,
        height: port.longitude
      }
    case PortAlignment.Left:
      return {
        x: nodePlacement.x - port.longitude * (100 - port.depthRatio) / 100,
        y: nodePlacement.y + nodePlacement.height * port.edgePosRatio / 100 - port.latitude / 2,
        width: port.latitude,
        height: port.longitude
      }
    case PortAlignment.Right:
      return {
        x: nodePlacement.x + nodePlacement.width - port.longitude * port.depthRatio / 100,
        y: nodePlacement.y + nodePlacement.height * port.edgePosRatio / 100 - port.latitude / 2,
        width: port.latitude,
        height: port.longitude
      };
    default:
      throw new Error("Unknown port alignment:" + port.alignment);
  }
}

function updatePortPlacementsForNode(node: NodeState) {
  node.ports.forEach(port => port.placement = portBounds(node.placement, port))
}


const linkPlacement = (link: LinkState, portPlacement1: Bounds, portPlacement2: Bounds): LinkPlacement => {
    const p1 = center(portPlacement1);
    const p2 = center(portPlacement2);

    return {
      // svgPath: PathGenerators.Smooth(link, [p1, p2], p1, p2).path
      svgPath: PathGenerators.Straight(link, [], p1, p2).path
    };
}

const getDefaultDiagramState = (): ClassDiagramState => {
  const port11: PortState = {
    id: "port11",
    edgePosRatio: 50,
    alignment: PortAlignment.Right,
    depthRatio: 50,
    latitude: 8,
    longitude: 8,
    placement:  {} as Bounds,
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
      port11,
      // port12,
      // port13
    ],
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
      port2,
    ],
    placement: {
      y: 300,
      x: 300,
      width: 100,
      height: 80
    }
  };


  const nodes = [node1, node2];
  const link1: LinkState = {
    port1: port11, port2: port2,
    placement: {svgPath: []}
  };

  nodes.forEach(node => updatePortPlacementsForNode(node))


  const links = [link1];
  links.forEach(link => link.placement = linkPlacement(link, link.port1.placement, link.port2.placement));

  return {
    Nodes: nodes,
    Links: links
  };
};

const getDefaultDiagramViewState = (): ClassDiagramViewState => {
  const diagramState = getDefaultDiagramState();
  return {
    ...diagramState,
    selectedElementIds: [],
    focusedElementId: null,
  };
};

const nodePlacementAfterResize = ({placement}: NodeState, deltaBounds: Bounds) : Bounds => {
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

interface NodeSelectAction {
  node: NodeState
  shiftKey: boolean
  ctrlKey: boolean
}


export const classDiagramSlice = createSlice({
  name: 'classDiagram',
  initialState,
  reducers: {
    nodeDeselect: (state) => {
      state.selectedElementIds = [];
      state.focusedElementId = null
    },

    nodeSelect: (state, action: PayloadAction<NodeSelectAction>) => {
      const append = action.payload.shiftKey || action.payload.ctrlKey
      let selectedIds: string[] = state.selectedElementIds;
      const nodeId = action.payload.node.id;
      if (!append) {
        selectedIds = [nodeId]
      } else {
        if (!state.selectedElementIds.includes(nodeId)) {
          selectedIds.push(nodeId)
        } else
          selectedIds = selectedIds.filter(e => e !== nodeId)
      }

      state.selectedElementIds = selectedIds;
      state.focusedElementId = selectedIds.length > 0 ? selectedIds[selectedIds.length-1] : null
    },

    nodeResize: (state, action: PayloadAction<NodeResizeAction>) => {
      const node = action.payload.node;
      const index = state.Nodes.findIndex(e => e.id === node.id);
      if (index < 0)
        throw new Error("Node not found by id: " + node.id);

      const nodePlacement = nodePlacementAfterResize(node, action.payload.deltaBounds);
      state.Nodes[index].placement = nodePlacement;

      const portAffected = state.Nodes[index].ports;
      const portPlacements: { [key: string]: Bounds } = {};

      portAffected.forEach(port => {
        const bounds = portBounds(nodePlacement, port);
        portPlacements[port.id] = bounds;
        port.placement = bounds;
      });

      state.Links
          .filter(link => portPlacements[link.port1.id] || portPlacements[link.port2.id])
          .forEach(link => link.placement = linkPlacement(link, portPlacements[link.port1.id] || link.port1.placement, portPlacements[link.port2.id] || link.port2.placement));
    },
  },
})

export const { nodeResize, nodeSelect, nodeDeselect } = classDiagramSlice.actions

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
export const selectNodes = (state: RootState) => state.diagram.Nodes;

export default classDiagramSlice.reducer

