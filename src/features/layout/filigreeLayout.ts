import {LAYERED_ALGORITHM_ID, layout, type INode} from "@benkalegin/filigree-api";
import {ClusterDef, LayoutHints, LayoutLink, LayoutNode, LayoutNodeBounds, OrderHint} from "./autoLayout";

const DEFAULT_RANK_SEP = 80;
const DEFAULT_NODE_SEP = 60;
const CLUSTER_PADDING = 20;
const CLUSTER_LABEL_HEIGHT = 22; // matches ClusterContainer LABEL_HEIGHT

interface MutableEdge {
    id: string;
    sources: string[];
    targets: string[];
}

interface MutableNode {
    id: string;
    width?: number;
    height?: number;
    layoutOptions?: Record<string, unknown>;
    children?: MutableNode[];
    edges?: MutableEdge[];
}

interface JsonHint {
    kind: string;
    [field: string]: unknown;
}

interface MutableGraph extends MutableNode {
    filigreeHints?: JsonHint[];
}

function filigreeDirection(direction: LayoutHints["direction"]): string {
    switch (direction) {
        case "LR": return "RIGHT";
        case "RL": return "LEFT";
        case "BT": return "UP";
        case "TB":
        default:   return "DOWN";
    }
}

/**
 * Filigree's layered algorithm has no `hierarchyHandling: INCLUDE_CHILDREN`
 * equivalent — cross-compound edges don't influence inter-cluster ordering at
 * the parent layer. Compound bounds returned per cluster are still correct,
 * so we feed filigree the hierarchical JSON it expects and pull positions
 * straight from the result tree.
 */
export async function applyFiligreeLayout(
    nodes: { [id: string]: LayoutNode },
    links: LayoutLink[],
    hints?: LayoutHints,
    clusters?: { [clusterId: string]: ClusterDef },
    nodeParents?: { [nodeId: string]: string },
    clusterParents?: { [clusterId: string]: string },
    orderHints?: OrderHint[]
): Promise<{ [clusterId: string]: LayoutNodeBounds }> {
    const clusterIds = clusters ? Object.keys(clusters) : [];
    // Drop ids from `nodes` that are also cluster ids — some callers
    // (deployment importer's second pass) re-pass a `nodes` map that already
    // has cluster bounds baked in from a prior layout.
    const nodeIds = Object.keys(nodes).filter(id => !clusters?.[id]);
    if (nodeIds.length === 0 && clusterIds.length === 0) return {};

    const direction = filigreeDirection(hints?.direction);
    const layerSpacing = hints?.rankSep ?? DEFAULT_RANK_SEP;
    const nodeSpacing = hints?.nodeSep ?? DEFAULT_NODE_SEP;
    const compoundPadding = CLUSTER_PADDING + CLUSTER_LABEL_HEIGHT;

    const ROOT = "__root__";
    const childrenOf: { [containerId: string]: MutableNode[] } = {[ROOT]: []};
    const containerFor = (id: string): string =>
        (nodeParents?.[id] ?? clusterParents?.[id]) ?? ROOT;

    // Two passes over clusters: first create all cluster nodes so any
    // sibling/child cluster can find its parent's children array by id even
    // when declared in non-topological order.
    const clusterNodeById: { [id: string]: MutableNode } = {};
    for (const cid of clusterIds) {
        const node: MutableNode = {
            id: cid,
            layoutOptions: {"elk.padding": compoundPadding},
            children: []
        };
        clusterNodeById[cid] = node;
        childrenOf[cid] = node.children!;
    }
    for (const cid of clusterIds) {
        (childrenOf[containerFor(cid)] ??= []).push(clusterNodeById[cid]);
    }

    for (const id of nodeIds) {
        const {width, height} = nodes[id].bounds;
        (childrenOf[containerFor(id)] ??= []).push({id, width, height});
    }

    // Filigree's per-compound layout only sees edges declared inside the
    // compound's own `edges` array — there's no INCLUDE_CHILDREN. Place each
    // edge at the lowest common ancestor of its endpoints so intra-compound
    // chains stack within the compound.
    const parentOf = (id: string): string | undefined =>
        nodeParents?.[id] ?? clusterParents?.[id];
    const ancestorsOf = (id: string): string[] => {
        const acc: string[] = [];
        let cur = parentOf(id);
        while (cur) {
            acc.push(cur);
            cur = clusterParents?.[cur];
        }
        return acc;
    };
    const lca = (a: string, b: string): string => {
        const aChain = new Set<string>([a, ...ancestorsOf(a)]);
        if (aChain.has(b)) return b;
        let cur = parentOf(b);
        while (cur) {
            if (aChain.has(cur)) return cur;
            cur = clusterParents?.[cur];
        }
        return ROOT;
    };

    const edgesByContainer: { [containerId: string]: MutableEdge[] } = {};
    for (const [index, link] of links.entries()) {
        if (!nodes[link.source] || !nodes[link.target]) continue;
        const container = lca(link.source, link.target);
        (edgesByContainer[container] ??= []).push({
            id: `e${index}`,
            sources: [link.source],
            targets: [link.target]
        });
    }
    for (const cid of clusterIds) {
        const containerEdges = edgesByContainer[cid];
        if (containerEdges) clusterNodeById[cid].edges = containerEdges;
    }

    const root: MutableGraph = {
        id: "root",
        layoutOptions: {
            "elk.algorithm": LAYERED_ALGORITHM_ID,
            "elk.direction": direction,
            "elk.layered.spacing.layer": layerSpacing,
            "elk.layered.spacing.nodeNode": nodeSpacing,
            "elk.padding": compoundPadding
        },
        children: childrenOf[ROOT],
        edges: edgesByContainer[ROOT] ?? [],
        filigreeHints: orderHints?.length
            ? orderHints.map(h => ({kind: "order-before", nodeAId: h.before, nodeBId: h.after}))
            : undefined
    };

    const result = await layout(root as never);

    const placed: { [id: string]: LayoutNodeBounds } = {};
    const collect = (parent: { children: readonly INode[] }, originX: number, originY: number): void => {
        for (const child of parent.children) {
            const x = originX + child.x;
            const y = originY + child.y;
            placed[child.id] = {x, y, width: child.width, height: child.height};
            collect(child, x, y);
        }
    };
    collect(result, 0, 0);

    for (const id of nodeIds) {
        const p = placed[id];
        if (!p) continue;
        nodes[id].bounds.x = p.x;
        nodes[id].bounds.y = p.y;
    }

    const clusterBoundsById: { [clusterId: string]: LayoutNodeBounds } = {};
    for (const cid of clusterIds) {
        const p = placed[cid];
        if (!p) continue;
        clusterBoundsById[cid] = p;
    }
    return clusterBoundsById;
}
