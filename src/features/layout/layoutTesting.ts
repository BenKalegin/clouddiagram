import {Bounds, center, Coordinate} from "../../common/model";
import {ElementType, PortAlignment} from "../../package/packageModel";

export interface LaidOutDiagram {
    diagram: {
        nodes: { [id: string]: { bounds: Bounds } };
        ports?: { [id: string]: { alignment?: PortAlignment } };
    };
    elements: { [id: string]: any };
}

const centerX = (b: Bounds): number => center(b).x;
const centerY = (b: Bounds): number => center(b).y;

function boundsContain(outer: Bounds, inner: Bounds, pad = 4): boolean {
    return inner.x >= outer.x - pad
        && inner.y >= outer.y - pad
        && inner.x + inner.width <= outer.x + outer.width + pad
        && inner.y + inner.height <= outer.y + outer.height + pad;
}

function nodeKey(text: string): string {
    return text.replace(/<[^>]+>/g, "").split("\n")[0].trim().toLowerCase();
}

function fullKey(text: string): string {
    return text.replace(/<[^>]+>/g, "").trim().toLowerCase();
}

function buildIndex(elements: { [id: string]: any }, type: ElementType): Map<string, any> {
    const idx = new Map<string, any>();
    for (const el of Object.values(elements)) {
        if (el?.type !== type) continue;
        const key = nodeKey(String(el.text ?? ""));
        if (!key) continue;
        if (idx.has(key)) {
            idx.set(fullKey(String(el.text)), el);
        } else {
            idx.set(key, el);
        }
    }
    return idx;
}

function lookup(idx: Map<string, any>, text: string, what: string): any {
    const el = idx.get(nodeKey(text)) ?? idx.get(fullKey(text));
    if (!el) throw new Error(`${what} "${text}" not found in layout`);
    return el;
}

function segmentsIntersect(a1: Coordinate, a2: Coordinate, b1: Coordinate, b2: Coordinate): boolean {
    const cross = (p: Coordinate, q: Coordinate, r: Coordinate): number =>
        (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
    const d1 = cross(b1, b2, a1);
    const d2 = cross(b1, b2, a2);
    const d3 = cross(a1, a2, b1);
    const d4 = cross(a1, a2, b2);
    return d1 * d2 < 0 && d3 * d4 < 0;
}

export interface NodeAssert {
    rightOf(...others: string[]): NodeAssert;
    leftOf(...others: string[]): NodeAssert;
    above(...others: string[]): NodeAssert;
    below(...others: string[]): NodeAssert;
    sameRowAs(...others: string[]): NodeAssert;
    sameColAs(...others: string[]): NodeAssert;
    centeredHorizontallyWith(other: string, tol?: number): NodeAssert;
    centeredVerticallyWith(other: string, tol?: number): NodeAssert;
    widthRelativeTo(other: string, range: { min: number; max: number }): NodeAssert;
    insideCluster(text: string): NodeAssert;
}

export interface NodesAssert {
    orderedLeftToRight(): NodesAssert;
    orderedTopToBottom(): NodesAssert;
    sameRow(tol?: number): NodesAssert;
    sameColumn(tol?: number): NodesAssert;
}

export interface EdgeQuery {
    fromText: string;
    toText: string;
}

export interface EdgeAssert {
    hasLabel(label: string | undefined): EdgeAssert;
}

export interface EdgesAssert {
    noCrossings(opts?: { max?: number }): EdgesAssert;
    count(n: number): EdgesAssert;
}

export interface ClusterAssert {
    contains(...nodeTexts: string[]): ClusterAssert;
}

export interface NodePorts {
    incoming: PortAlignment[];
    outgoing: PortAlignment[];
}

export interface LayoutFacade {
    node(text: string): NodeAssert;
    nodes(...texts: string[]): NodesAssert;
    edge(q: EdgeQuery): EdgeAssert;
    edges(): EdgesAssert;
    cluster(text: string): ClusterAssert;
    bounds(text: string): Bounds;
    portsOf(text: string): NodePorts;
    distinctRowCount(tol?: number): number;
}

export function layoutFor(result: LaidOutDiagram): LayoutFacade {
    const {diagram, elements} = result;
    const nodeIdx = buildIndex(elements, ElementType.ClassNode);
    const clusterIdx = buildIndex(elements, ElementType.Cluster);

    const findNode = (text: string) => lookup(nodeIdx, text, "Node");
    const findCluster = (text: string) => lookup(clusterIdx, text, "Cluster");

    const boundsOf = (el: any): Bounds => {
        const nb = diagram.nodes[el.id];
        if (!nb?.bounds) throw new Error(`No bounds for "${el.text}"`);
        return nb.bounds;
    };

    const allElements = Object.values(elements);
    const nodes = allElements.filter((e: any) => e?.type === ElementType.ClassNode);
    const links = allElements.filter((e: any) => e?.type === ElementType.ClassLink);

    const endpointsOf = (link: any): [any, any] | undefined => {
        const p1 = elements[link.port1];
        const p2 = elements[link.port2];
        if (!p1 || !p2) return undefined;
        const n1 = elements[p1.nodeId];
        const n2 = elements[p2.nodeId];
        if (!n1 || !n2) return undefined;
        return [n1, n2];
    };

    const findEdge = (q: EdgeQuery): any => {
        const from = nodeKey(q.fromText);
        const to = nodeKey(q.toText);
        for (const link of links) {
            const ep = endpointsOf(link);
            if (!ep) continue;
            const [a, b] = ep;
            if (nodeKey(String(a.text ?? "")) === from && nodeKey(String(b.text ?? "")) === to) {
                return link;
            }
        }
        throw new Error(`Edge "${q.fromText}" → "${q.toText}" not found`);
    };

    function nodeAssert(text: string): NodeAssert {
        const self = findNode(text);
        const sb = boundsOf(self);

        const api: NodeAssert = {
            rightOf(...others) {
                for (const o of others) {
                    const ob = boundsOf(findNode(o));
                    if (centerX(sb) <= centerX(ob)) {
                        throw new Error(
                            `Expected "${text}" right of "${o}" ` +
                            `(centerX ${centerX(sb).toFixed(1)} vs ${centerX(ob).toFixed(1)})`
                        );
                    }
                }
                return api;
            },
            leftOf(...others) {
                for (const o of others) {
                    const ob = boundsOf(findNode(o));
                    if (centerX(sb) >= centerX(ob)) {
                        throw new Error(`Expected "${text}" left of "${o}"`);
                    }
                }
                return api;
            },
            above(...others) {
                for (const o of others) {
                    const ob = boundsOf(findNode(o));
                    if (centerY(sb) >= centerY(ob)) {
                        throw new Error(`Expected "${text}" above "${o}"`);
                    }
                }
                return api;
            },
            below(...others) {
                for (const o of others) {
                    const ob = boundsOf(findNode(o));
                    if (centerY(sb) <= centerY(ob)) {
                        throw new Error(`Expected "${text}" below "${o}"`);
                    }
                }
                return api;
            },
            sameRowAs(...others) {
                for (const o of others) {
                    const ob = boundsOf(findNode(o));
                    const tol = Math.max(sb.height, ob.height) / 2;
                    const delta = Math.abs(centerY(sb) - centerY(ob));
                    if (delta > tol) {
                        throw new Error(
                            `Expected "${text}" in same row as "${o}" (Δy=${delta.toFixed(1)}, tol=${tol.toFixed(1)})`
                        );
                    }
                }
                return api;
            },
            sameColAs(...others) {
                for (const o of others) {
                    const ob = boundsOf(findNode(o));
                    const tol = Math.max(sb.width, ob.width) / 2;
                    const delta = Math.abs(centerX(sb) - centerX(ob));
                    if (delta > tol) {
                        throw new Error(`Expected "${text}" in same column as "${o}"`);
                    }
                }
                return api;
            },
            centeredHorizontallyWith(other, tol = 4) {
                const ob = boundsOf(findNode(other));
                if (Math.abs(centerX(sb) - centerX(ob)) > tol) {
                    throw new Error(`Expected "${text}" centered with "${other}" within ${tol}px`);
                }
                return api;
            },
            centeredVerticallyWith(other, tol = 4) {
                const ob = boundsOf(findNode(other));
                if (Math.abs(centerY(sb) - centerY(ob)) > tol) {
                    throw new Error(`Expected "${text}" vertically centered with "${other}" within ${tol}px`);
                }
                return api;
            },
            widthRelativeTo(other, range) {
                const ob = boundsOf(findNode(other));
                const ratio = sb.width / ob.width;
                if (ratio < range.min || ratio > range.max) {
                    throw new Error(
                        `Expected width("${text}")/width("${other}") in [${range.min}, ${range.max}], got ${ratio.toFixed(2)}`
                    );
                }
                return api;
            },
            insideCluster(clusterText) {
                if (!boundsContain(boundsOf(findCluster(clusterText)), sb)) {
                    throw new Error(`Expected "${text}" inside cluster "${clusterText}"`);
                }
                return api;
            }
        };
        return api;
    }

    function nodesAssert(...texts: string[]): NodesAssert {
        if (texts.length < 2) throw new Error("nodes(...) needs at least two ids");
        const items = texts.map(t => ({text: t, b: boundsOf(findNode(t))}));

        const api: NodesAssert = {
            orderedLeftToRight() {
                for (let i = 1; i < items.length; i++) {
                    if (centerX(items[i].b) <= centerX(items[i - 1].b)) {
                        throw new Error(
                            `Expected "${items[i].text}" right of "${items[i - 1].text}" ` +
                            `(centerX ${centerX(items[i].b).toFixed(1)} vs ${centerX(items[i - 1].b).toFixed(1)})`
                        );
                    }
                }
                return api;
            },
            orderedTopToBottom() {
                for (let i = 1; i < items.length; i++) {
                    if (centerY(items[i].b) <= centerY(items[i - 1].b)) {
                        throw new Error(`Expected "${items[i].text}" below "${items[i - 1].text}"`);
                    }
                }
                return api;
            },
            sameRow(tol) {
                const ref = items[0];
                for (let i = 1; i < items.length; i++) {
                    const t = tol ?? Math.max(ref.b.height, items[i].b.height) / 2;
                    if (Math.abs(centerY(items[i].b) - centerY(ref.b)) > t) {
                        throw new Error(`Expected "${items[i].text}" in same row as "${ref.text}"`);
                    }
                }
                return api;
            },
            sameColumn(tol) {
                const ref = items[0];
                for (let i = 1; i < items.length; i++) {
                    const t = tol ?? Math.max(ref.b.width, items[i].b.width) / 2;
                    if (Math.abs(centerX(items[i].b) - centerX(ref.b)) > t) {
                        throw new Error(`Expected "${items[i].text}" in same column as "${ref.text}"`);
                    }
                }
                return api;
            }
        };
        return api;
    }

    function edgeAssert(q: EdgeQuery): EdgeAssert {
        const link = findEdge(q);
        const api: EdgeAssert = {
            hasLabel(label) {
                const actual = link.text;
                if (actual !== label) {
                    throw new Error(
                        `Expected edge "${q.fromText}" → "${q.toText}" label ${JSON.stringify(label)}, got ${JSON.stringify(actual)}`
                    );
                }
                return api;
            }
        };
        return api;
    }

    function edgesAssert(): EdgesAssert {
        const api: EdgesAssert = {
            noCrossings(opts) {
                const max = opts?.max ?? 0;
                const segments = links.map(l => {
                    const ep = endpointsOf(l);
                    if (!ep) return null;
                    const [a, b] = ep;
                    return {
                        from: {x: centerX(boundsOf(a)), y: centerY(boundsOf(a))},
                        to: {x: centerX(boundsOf(b)), y: centerY(boundsOf(b))},
                        a: a.id,
                        b: b.id
                    };
                }).filter((s): s is NonNullable<typeof s> => s !== null);

                let crossings = 0;
                for (let i = 0; i < segments.length; i++) {
                    for (let j = i + 1; j < segments.length; j++) {
                        const s1 = segments[i], s2 = segments[j];
                        if (s1.a === s2.a || s1.a === s2.b || s1.b === s2.a || s1.b === s2.b) continue;
                        if (segmentsIntersect(s1.from, s1.to, s2.from, s2.to)) crossings++;
                    }
                }
                if (crossings > max) {
                    throw new Error(`Expected ≤${max} edge crossings, got ${crossings}`);
                }
                return api;
            },
            count(n) {
                if (links.length !== n) {
                    throw new Error(`Expected ${n} edges, got ${links.length}`);
                }
                return api;
            }
        };
        return api;
    }

    function clusterAssert(text: string): ClusterAssert {
        const cb = boundsOf(findCluster(text));
        const api: ClusterAssert = {
            contains(...nodeTexts) {
                for (const t of nodeTexts) {
                    if (!boundsContain(cb, boundsOf(findNode(t)))) {
                        throw new Error(`Expected "${t}" inside cluster "${text}"`);
                    }
                }
                return api;
            }
        };
        return api;
    }

    return {
        node: nodeAssert,
        nodes: nodesAssert,
        edge: edgeAssert,
        edges: edgesAssert,
        cluster: clusterAssert,
        bounds: (text) => boundsOf(findNode(text)),
        portsOf: (text) => {
            const node = findNode(text);
            const incoming: PortAlignment[] = [];
            const outgoing: PortAlignment[] = [];
            const ports = diagram.ports ?? {};
            for (const link of links) {
                const ep = endpointsOf(link);
                if (!ep) continue;
                const [a, b] = ep;
                if (a.id === node.id) {
                    const align = ports[link.port1]?.alignment;
                    if (align !== undefined) outgoing.push(align);
                }
                if (b.id === node.id) {
                    const align = ports[link.port2]?.alignment;
                    if (align !== undefined) incoming.push(align);
                }
            }
            return {incoming, outgoing};
        },
        distinctRowCount: (tol = 16) => {
            const cys = nodes.map(n => centerY(boundsOf(n))).sort((a, b) => a - b);
            let rows = 0;
            let last = -Infinity;
            for (const y of cys) {
                if (y - last > tol) {
                    rows++;
                    last = y;
                }
            }
            return rows;
        }
    };
}
