import * as dagre from "@dagrejs/dagre";

export type LayoutDirection = "TB" | "BT" | "LR" | "RL";

export interface LayoutHints {
    direction?: LayoutDirection;
    rankSep?: number;
    nodeSep?: number;
    edgeSep?: number;
}

export interface LayoutNodeBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface LayoutNode {
    bounds: LayoutNodeBounds;
}

export interface LayoutLink {
    source: string;
    target: string;
}

const DEFAULT_DIRECTION: LayoutDirection = "TB";
const DEFAULT_RANK_SEP = 80;
const DEFAULT_NODE_SEP = 60;
const DEFAULT_EDGE_SEP = 20;
const LAYOUT_ORIGIN_X = 80;
const LAYOUT_ORIGIN_Y = 80;

/**
 * Run a hierarchical layout (dagre) over the given nodes/links and write the
 * computed top-left coordinates back into each node's bounds. Nodes without an
 * incident edge are placed by dagre as disconnected components.
 */
export function applyAutoLayout(
    nodes: { [id: string]: LayoutNode },
    links: LayoutLink[],
    hints?: LayoutHints
): void {
    const nodeIds = Object.keys(nodes);
    if (nodeIds.length === 0) return;

    const graph = new dagre.graphlib.Graph({ multigraph: true });
    graph.setGraph({
        rankdir: hints?.direction ?? DEFAULT_DIRECTION,
        ranksep: hints?.rankSep ?? DEFAULT_RANK_SEP,
        nodesep: hints?.nodeSep ?? DEFAULT_NODE_SEP,
        edgesep: hints?.edgeSep ?? DEFAULT_EDGE_SEP,
        marginx: LAYOUT_ORIGIN_X,
        marginy: LAYOUT_ORIGIN_Y
    });
    graph.setDefaultEdgeLabel(() => ({}));

    for (const id of nodeIds) {
        const { width, height } = nodes[id].bounds;
        graph.setNode(id, { width, height });
    }

    for (const [index, link] of links.entries()) {
        if (!nodes[link.source] || !nodes[link.target]) continue;
        graph.setEdge(link.source, link.target, {}, `e${index}`);
    }

    dagre.layout(graph);

    for (const id of nodeIds) {
        const placed = graph.node(id);
        if (!placed) continue;
        const node = nodes[id];
        node.bounds.x = placed.x - node.bounds.width / 2;
        node.bounds.y = placed.y - node.bounds.height / 2;
    }
}
