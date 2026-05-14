import {Diagram} from "../../common/model";
import {ElementType, FlowchartNodeKind, PortAlignment} from "../../package/packageModel";
import {ClusterDef, computeDisplaySize, LayoutHints, LayoutLink, LayoutNode, OrderHint} from "./autoLayout";
import {applyFiligreeLayout} from "./filigreeLayout";
import {parseMermaidLayoutHints} from "../export/mermaid/mermaidImportUtils";

interface DiagramInternal {
    elements: { [id: string]: any };
    nodes: { [id: string]: { bounds: { x: number; y: number; width: number; height: number } } };
    ports: { [id: string]: { alignment?: PortAlignment; edgePosRatio?: number } };
    display: { width: number; height: number; scale: number; offset: { x: number; y: number } };
}

const STRUCTURE_DIAGRAM_TYPES = new Set([
    ElementType.ClassDiagram,
    ElementType.FlowchartDiagram,
    ElementType.DeploymentDiagram
]);

export function canRelayoutStructure(diagram: Diagram | { type: ElementType }): boolean {
    return STRUCTURE_DIAGRAM_TYPES.has(diagram.type);
}

export async function relayoutStructure<T extends Diagram>(
    diagram: T,
    content: string
): Promise<T> {
    const dia = diagram as unknown as Diagram & DiagramInternal;
    if (!dia.elements || !dia.nodes) return diagram;

    const hints = parseMermaidLayoutHints(content);

    const clusters: { [id: string]: ClusterDef } = {};
    const nodeParents: { [id: string]: string } = {};
    const clusterParents: { [id: string]: string } = {};
    for (const el of Object.values(dia.elements)) {
        if (el?.type !== ElementType.Cluster) continue;
        clusters[el.id] = {label: el.text ?? el.id};
        for (const memberId of el.memberNodeIds ?? []) {
            const member = dia.elements[memberId];
            if (member?.type === ElementType.Cluster) clusterParents[memberId] = el.id;
            else nodeParents[memberId] = el.id;
        }
    }

    const layoutNodes: { [id: string]: LayoutNode } = {};
    for (const el of Object.values(dia.elements)) {
        if (el?.type !== ElementType.ClassNode) continue;
        const nb = dia.nodes[el.id];
        if (!nb?.bounds) continue;
        layoutNodes[el.id] = {bounds: {...nb.bounds}};
    }
    if (Object.keys(layoutNodes).length === 0) return diagram;

    const edges: LayoutLink[] = [];
    for (const el of Object.values(dia.elements)) {
        if (el?.type !== ElementType.ClassLink) continue;
        const p1 = dia.elements[el.port1];
        const p2 = dia.elements[el.port2];
        if (!p1 || !p2) continue;
        if (!layoutNodes[p1.nodeId] || !layoutNodes[p2.nodeId]) continue;
        edges.push({source: p1.nodeId, target: p2.nodeId});
    }

    const targetsBySource = new Map<string, string[]>();
    for (const edge of edges) {
        const list = targetsBySource.get(edge.source);
        if (list) list.push(edge.target);
        else targetsBySource.set(edge.source, [edge.target]);
    }
    const orderHints: OrderHint[] = [];
    for (const targets of targetsBySource.values()) {
        for (let i = 1; i < targets.length; i++) {
            orderHints.push({before: targets[i - 1], after: targets[i]});
        }
    }

    const clusterBoundsById = await applyFiligreeLayout(
        layoutNodes, edges, hints, clusters, nodeParents, clusterParents, orderHints
    );

    const newNodes: DiagramInternal["nodes"] = {...dia.nodes};
    for (const [id, ln] of Object.entries(layoutNodes)) {
        newNodes[id] = {...newNodes[id], bounds: {...ln.bounds}};
    }
    for (const [cid, bounds] of Object.entries(clusterBoundsById)) {
        newNodes[cid] = {...newNodes[cid], bounds};
    }

    const realignedPorts = adjustPortAlignments(dia, newNodes, hints);
    const newPorts = distributePortsAlongSides(dia, realignedPorts, newNodes);

    const {width, height} = computeDisplaySize(newNodes);

    return {
        ...diagram,
        nodes: newNodes,
        ports: newPorts,
        display: {
            ...dia.display,
            width,
            height,
            offset: {x: 0, y: 0}
        }
    } as T;
}

interface LinkAssignment {
    port1: string;
    port2: string;
    srcNodeId: string;
    tgtNodeId: string;
    srcAlign: PortAlignment;
    tgtAlign: PortAlignment;
    dx: number;
    dy: number;
}

function adjustPortAlignments(
    dia: Diagram & DiagramInternal,
    newNodes: DiagramInternal["nodes"],
    hints: LayoutHints
): DiagramInternal["ports"] {
    const assignments: LinkAssignment[] = [];

    for (const el of Object.values(dia.elements)) {
        if (el?.type !== ElementType.ClassLink) continue;
        const p1 = dia.elements[el.port1];
        const p2 = dia.elements[el.port2];
        if (!p1 || !p2) continue;
        const sb = newNodes[p1.nodeId]?.bounds;
        const tb = newNodes[p2.nodeId]?.bounds;
        if (!sb || !tb) continue;
        const sx = sb.x + sb.width / 2;
        const sy = sb.y + sb.height / 2;
        const tx = tb.x + tb.width / 2;
        const ty = tb.y + tb.height / 2;
        const dx = tx - sx;
        const dy = ty - sy;
        let srcAlign: PortAlignment;
        let tgtAlign: PortAlignment;
        if (Math.abs(dx) >= Math.abs(dy)) {
            srcAlign = dx >= 0 ? PortAlignment.Right : PortAlignment.Left;
            tgtAlign = dx >= 0 ? PortAlignment.Left : PortAlignment.Right;
        } else {
            srcAlign = dy >= 0 ? PortAlignment.Bottom : PortAlignment.Top;
            tgtAlign = dy >= 0 ? PortAlignment.Top : PortAlignment.Bottom;
        }
        assignments.push({
            port1: el.port1, port2: el.port2,
            srcNodeId: p1.nodeId, tgtNodeId: p2.nodeId,
            srcAlign, tgtAlign, dx, dy
        });
    }

    applyDecisionNodeConvention(dia, assignments, hints);

    const ports: DiagramInternal["ports"] = {...dia.ports};
    for (const a of assignments) {
        const sp = ports[a.port1];
        const tp = ports[a.port2];
        if (sp) ports[a.port1] = {...sp, alignment: a.srcAlign};
        if (tp) ports[a.port2] = {...tp, alignment: a.tgtAlign};
    }
    return ports;
}

function applyDecisionNodeConvention(
    dia: Diagram & DiagramInternal,
    assignments: LinkAssignment[],
    hints: LayoutHints
): void {
    const vertical = hints.direction === "TB" || hints.direction === "BT";
    const inputSide = vertical ? PortAlignment.Top : PortAlignment.Left;
    const mainOutputSide = vertical ? PortAlignment.Bottom : PortAlignment.Right;
    const branchSides: PortAlignment[] = vertical
        ? [PortAlignment.Right, PortAlignment.Left]
        : [PortAlignment.Bottom, PortAlignment.Top];

    const incomingByNode: { [nodeId: string]: LinkAssignment[] } = {};
    const outgoingByNode: { [nodeId: string]: LinkAssignment[] } = {};
    for (const a of assignments) {
        (outgoingByNode[a.srcNodeId] ??= []).push(a);
        (incomingByNode[a.tgtNodeId] ??= []).push(a);
    }

    for (const el of Object.values(dia.elements)) {
        if (el?.type !== ElementType.ClassNode) continue;
        if (el.flowchartKind !== FlowchartNodeKind.Decision) continue;
        const incoming = incomingByNode[el.id] ?? [];
        const outgoing = outgoingByNode[el.id] ?? [];

        for (const a of incoming) a.tgtAlign = inputSide;

        const ranked = [...outgoing].sort((a, b) =>
            vertical ? (b.dy - a.dy) : (b.dx - a.dx)
        );
        for (let i = 0; i < ranked.length; i++) {
            ranked[i].srcAlign = i === 0 ? mainOutputSide : branchSides[(i - 1) % branchSides.length];
        }
    }
}

function distributePortsAlongSides(
    diagram: Diagram & DiagramInternal,
    ports: DiagramInternal["ports"],
    nodes: DiagramInternal["nodes"]
): DiagramInternal["ports"] {
    const otherEndpointOf: { [portId: string]: string } = {};
    for (const el of Object.values(diagram.elements)) {
        if (el?.type !== ElementType.ClassLink) continue;
        const p1 = diagram.elements[el.port1];
        const p2 = diagram.elements[el.port2];
        if (p1 && p2) {
            otherEndpointOf[el.port1] = p2.nodeId;
            otherEndpointOf[el.port2] = p1.nodeId;
        }
    }

    const groups: { [key: string]: string[] } = {};
    for (const el of Object.values(diagram.elements)) {
        if (el?.type !== ElementType.ClassPort) continue;
        const port = ports[el.id];
        if (port?.alignment === undefined) continue;
        const key = `${el.nodeId}|${port.alignment}`;
        (groups[key] ??= []).push(el.id);
    }

    const result = {...ports};
    for (const [key, portIds] of Object.entries(groups)) {
        if (portIds.length <= 1) continue;
        const alignment = Number(key.split("|")[1]) as PortAlignment;
        const horizontal = alignment === PortAlignment.Top || alignment === PortAlignment.Bottom;
        portIds.sort((a, b) => {
            const oa = otherEndpointOf[a];
            const ob = otherEndpointOf[b];
            const ba = oa ? nodes[oa]?.bounds : undefined;
            const bb = ob ? nodes[ob]?.bounds : undefined;
            if (!ba || !bb) return 0;
            return horizontal
                ? (ba.x + ba.width / 2) - (bb.x + bb.width / 2)
                : (ba.y + ba.height / 2) - (bb.y + bb.height / 2);
        });
        const n = portIds.length;
        for (let i = 0; i < n; i++) {
            const ratio = ((i + 1) / (n + 1)) * 100;
            result[portIds[i]] = {...result[portIds[i]], edgePosRatio: ratio};
        }
    }
    return result;
}
