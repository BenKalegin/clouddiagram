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

export interface ClusterDef {
    label: string;
}

const DEFAULT_DIRECTION: LayoutDirection = "TB";
const DEFAULT_RANK_SEP = 80;
const DEFAULT_NODE_SEP = 60;
const DEFAULT_EDGE_SEP = 20;
const LAYOUT_ORIGIN_X = 80;
const LAYOUT_ORIGIN_Y = 80;
const CLUSTER_PADDING = 20;

/**
 * Run a hierarchical layout (dagre) over the given nodes/links and write the
 * computed top-left coordinates back into each node's bounds. Nodes without an
 * incident edge are placed by dagre as disconnected components.
 *
 * When clusters and nodeParents are provided the graph is treated as a compound
 * graph: dagre groups child nodes inside their parent cluster and returns bounds
 * for each cluster, which are returned as the function result.
 */
export function applyAutoLayout(
    nodes: { [id: string]: LayoutNode },
    links: LayoutLink[],
    hints?: LayoutHints,
    clusters?: { [clusterId: string]: ClusterDef },
    nodeParents?: { [nodeId: string]: string },
    clusterParents?: { [clusterId: string]: string }
): { [clusterId: string]: LayoutNodeBounds } {
    const nodeIds = Object.keys(nodes);
    if (nodeIds.length === 0) return {};

    const clusterIds = clusters ? Object.keys(clusters) : [];
    const hasCompound = clusterIds.length > 0;

    const graph = new dagre.graphlib.Graph({ multigraph: true, compound: hasCompound });
    graph.setGraph({
        rankdir: hints?.direction ?? DEFAULT_DIRECTION,
        ranksep: hints?.rankSep ?? DEFAULT_RANK_SEP,
        nodesep: hints?.nodeSep ?? DEFAULT_NODE_SEP,
        edgesep: hints?.edgeSep ?? DEFAULT_EDGE_SEP,
        marginx: LAYOUT_ORIGIN_X,
        marginy: LAYOUT_ORIGIN_Y
    });
    graph.setDefaultEdgeLabel(() => ({}));

    if (hasCompound) {
        for (const clusterId of clusterIds) {
            graph.setNode(clusterId, { clusterLabelPos: "top", paddingTop: CLUSTER_PADDING, paddingBottom: CLUSTER_PADDING, paddingLeft: CLUSTER_PADDING, paddingRight: CLUSTER_PADDING });
        }
    }

    for (const id of nodeIds) {
        const { width, height } = nodes[id].bounds;
        graph.setNode(id, { width, height });
    }

    if (hasCompound && clusterParents) {
        for (const [childId, parentId] of Object.entries(clusterParents)) {
            if (clusters?.[childId] && clusters?.[parentId]) {
                graph.setParent(childId, parentId);
            }
        }
    }

    if (hasCompound && nodeParents) {
        for (const [nodeId, parentId] of Object.entries(nodeParents)) {
            if (nodes[nodeId] && clusters?.[parentId]) {
                graph.setParent(nodeId, parentId);
            }
        }
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

    if (!hasCompound) return {};

    const clusterBounds: { [clusterId: string]: LayoutNodeBounds } = {};
    for (const clusterId of clusterIds) {
        const placed = graph.node(clusterId);
        if (placed?.width && placed?.height) {
            clusterBounds[clusterId] = {
                x: placed.x - placed.width / 2,
                y: placed.y - placed.height / 2,
                width: placed.width,
                height: placed.height
            };
        }
    }
    return clusterBounds;
}
