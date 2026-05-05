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
const CLUSTER_LABEL_HEIGHT = 22; // must match ClusterContainer LABEL_HEIGHT

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

    // For compound layouts, remove edges whose direction contradicts the
    // dominant inter-cluster flow (determined by majority vote over all
    // cross-cluster edges). This prevents minority "back-flow" edges such as
    // Lambda→DynamoDB from dragging cluster members to a lower rank and placing
    // them outside their parent cluster box.
    const layoutLinks = hasCompound
        ? filterMinorityClusterEdges(links, nodeParents ?? {}, clusterParents ?? {})
        : links;

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
            graph.setNode(clusterId, {
                clusterLabelPos: "top",
                paddingTop: CLUSTER_PADDING + CLUSTER_LABEL_HEIGHT,
                paddingBottom: CLUSTER_PADDING,
                paddingLeft: CLUSTER_PADDING,
                paddingRight: CLUSTER_PADDING
            });
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

    for (const [index, link] of layoutLinks.entries()) {
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

    // Derive cluster bounding boxes from positioned leaf nodes rather than
    // trusting dagre's cluster coordinates (unreliable for nested graphs).
    return computeClusterBoundsFromNodes(
        nodes, clusterIds, nodeParents ?? {}, clusterParents ?? {}
    );
}

/**
 * For each pair of distinct root-level clusters, count edges in each direction.
 * The minority direction (fewer edges) is discarded from the layout so dagre
 * can rank nodes without contradiction. Edges within the same root cluster, or
 * between standalone nodes, are always kept.
 */
function filterMinorityClusterEdges(
    links: LayoutLink[],
    nodeParents: { [nodeId: string]: string },
    clusterParents: { [clusterId: string]: string }
): LayoutLink[] {
    const rootOf = (nodeId: string): string | undefined => {
        let c = nodeParents[nodeId];
        if (!c) return undefined;
        while (clusterParents[c]) c = clusterParents[c];
        return c;
    };

    // Count cross-cluster edges in each direction
    const fwd: { [key: string]: number } = {}; // "A>B" → count
    for (const link of links) {
        const sc = rootOf(link.source), tc = rootOf(link.target);
        if (!sc || !tc || sc === tc) continue;
        const key = `${sc}>${tc}`;
        fwd[key] = (fwd[key] ?? 0) + 1;
    }

    // For each cluster pair, the dominant direction wins; minority edges are dropped
    const dominated = new Set<string>(); // "A>B" keys to remove
    const seen = new Set<string>();
    for (const key of Object.keys(fwd)) {
        const [a, b] = key.split(">") as [string, string];
        const pairKey = a < b ? `${a}|${b}` : `${b}|${a}`;
        if (seen.has(pairKey)) continue;
        seen.add(pairKey);
        const ab = fwd[`${a}>${b}`] ?? 0;
        const ba = fwd[`${b}>${a}`] ?? 0;
        if (ab >= ba) {
            dominated.add(`${b}>${a}`);
        } else {
            dominated.add(`${a}>${b}`);
        }
    }

    return links.filter(link => {
        const sc = rootOf(link.source), tc = rootOf(link.target);
        if (!sc || !tc || sc === tc) return true;
        return !dominated.has(`${sc}>${tc}`);
    });
}

function computeClusterBoundsFromNodes(
    nodes: { [id: string]: LayoutNode },
    clusterIds: string[],
    nodeParents: { [nodeId: string]: string },
    clusterParents: { [clusterId: string]: string }
): { [clusterId: string]: LayoutNodeBounds } {
    const directNodes: { [clusterId: string]: string[] } = {};
    const directChildClusters: { [clusterId: string]: string[] } = {};

    for (const cid of clusterIds) {
        directNodes[cid] = [];
        directChildClusters[cid] = [];
    }
    for (const [nodeId, parentId] of Object.entries(nodeParents)) {
        directNodes[parentId]?.push(nodeId);
    }
    for (const [childId, parentId] of Object.entries(clusterParents)) {
        directChildClusters[parentId]?.push(childId);
    }

    const result: { [clusterId: string]: LayoutNodeBounds } = {};

    function getBounds(clusterId: string): LayoutNodeBounds | null {
        if (result[clusterId]) return result[clusterId];

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        const expand = (b: LayoutNodeBounds) => {
            if (b.x < minX) minX = b.x;
            if (b.y < minY) minY = b.y;
            if (b.x + b.width > maxX) maxX = b.x + b.width;
            if (b.y + b.height > maxY) maxY = b.y + b.height;
        };

        for (const nodeId of directNodes[clusterId]) {
            const b = nodes[nodeId]?.bounds;
            if (b) expand(b);
        }
        for (const childId of directChildClusters[clusterId]) {
            const cb = getBounds(childId);
            if (cb) expand(cb);
        }

        if (minX === Infinity) return null;

        const bounds: LayoutNodeBounds = {
            x: minX - CLUSTER_PADDING,
            y: minY - (CLUSTER_LABEL_HEIGHT + CLUSTER_PADDING),
            width: (maxX - minX) + 2 * CLUSTER_PADDING,
            height: (maxY - minY) + CLUSTER_LABEL_HEIGHT + 2 * CLUSTER_PADDING
        };
        result[clusterId] = bounds;
        return bounds;
    }

    for (const clusterId of clusterIds) {
        getBounds(clusterId);
    }

    return result;
}
