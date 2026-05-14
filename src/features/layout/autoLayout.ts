import {applyFiligreeLayout} from "./filigreeLayout";

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

/**
 * A "soft" sibling-order hint. After layout, if both nodes land on the same
 * layer, `before` is forced to sit earlier in the layer's traversal order
 * than `after` (left-of for vertical layouts, above for horizontal). Honored
 * by filigree's layered algorithm; ignored by other algorithms.
 */
export interface OrderHint {
    before: string;
    after: string;
}

export function applyAutoLayout(
    nodes: { [id: string]: LayoutNode },
    links: LayoutLink[],
    hints?: LayoutHints,
    clusters?: { [clusterId: string]: ClusterDef },
    nodeParents?: { [nodeId: string]: string },
    clusterParents?: { [clusterId: string]: string },
    orderHints?: OrderHint[]
): Promise<{ [clusterId: string]: LayoutNodeBounds }> {
    return applyFiligreeLayout(nodes, links, hints, clusters, nodeParents, clusterParents, orderHints);
}

const DISPLAY_PADDING = 80;
const DISPLAY_MIN_WIDTH = 800;
const DISPLAY_MIN_HEIGHT = 600;

export function computeDisplaySize(nodes: { [id: string]: { bounds?: LayoutNodeBounds } }): { width: number; height: number } {
    let maxRight = DISPLAY_MIN_WIDTH;
    let maxBottom = DISPLAY_MIN_HEIGHT;
    for (const node of Object.values(nodes)) {
        const bounds = node?.bounds;
        if (!bounds) continue;
        maxRight = Math.max(maxRight, bounds.x + bounds.width);
        maxBottom = Math.max(maxBottom, bounds.y + bounds.height);
    }
    return {
        width: maxRight + DISPLAY_PADDING,
        height: maxBottom + DISPLAY_PADDING
    };
}
