import {Diagram} from "../../../common/model";
import {
    CornerStyle,
    ElementType,
    FlowchartNodeKind,
    LinkState,
    NodeState,
    PortAlignment,
    PortState,
    RouteStyle,
    TipStyle
} from "../../../package/packageModel";
import {defaultColorSchema} from "../../../common/colors/colorSchemas";
import {ClusterPlacement, StructureDiagramState} from "../../structureDiagram/structureDiagramState";
import {createMermaidIdGenerator, mermaidSourceLines} from "./mermaidImportUtils";
import {applyAutoLayout, ClusterDef, LayoutDirection, LayoutLink} from "../../layout/autoLayout";

type SpecialKind = "fork" | "join" | "choice";

export function importMermaidStateDiagram(baseDiagram: Diagram, content: string): Diagram {
    const generateId = createMermaidIdGenerator();
    const lines = mermaidSourceLines(content);

    const elements: { [id: string]: any } = {};
    const nodes: { [id: string]: any } = {};
    const ports: { [id: string]: any } = {};
    const links: { [id: string]: any } = {};
    const layoutEdges: LayoutLink[] = [];

    const stateMap = new Map<string, string>();
    const clusterDefs: { [key: string]: ClusterDef } = {};
    const nodeParents: { [nodeId: string]: string } = {};
    const clusterParents: { [clusterId: string]: string } = {};

    let direction: LayoutDirection | undefined;
    let nodeIndex = 0;
    const compositeStack: string[] = [];
    const startNodes = new Map<string, string>();
    const endNodes = new Map<string, string>();

    function clusterKey(name: string): string {
        return `__c__${name}`;
    }

    function currentClusterKey(): string | undefined {
        return compositeStack.length > 0 ? clusterKey(compositeStack[compositeStack.length - 1]) : undefined;
    }

    function makeNode(name: string, label: string, flowchartKind: FlowchartNodeKind): string {
        const nodeId = generateId();
        const width = 140;
        const height = flowchartKind === FlowchartNodeKind.Decision ? 70 : 60;
        const col = nodeIndex % 5;
        const row = Math.floor(nodeIndex / 5);

        elements[nodeId] = {
            id: nodeId,
            type: ElementType.ClassNode,
            text: label,
            ports: [],
            colorSchema: defaultColorSchema,
            flowchartKind
        } as NodeState;

        nodes[nodeId] = {
            bounds: {x: 100 + col * 200, y: 100 + row * 140, width, height}
        };

        const parentKey = currentClusterKey();
        if (parentKey) nodeParents[nodeId] = parentKey;

        stateMap.set(name, nodeId);
        nodeIndex++;
        return nodeId;
    }

    function getOrCreateState(name: string, label?: string, specialKind?: SpecialKind): string {
        if (stateMap.has(name)) {
            const nodeId = stateMap.get(name)!;
            if (label) (elements[nodeId] as NodeState).text = label;
            const parentKey = currentClusterKey();
            if (parentKey && !nodeParents[nodeId]) nodeParents[nodeId] = parentKey;
            return nodeId;
        }
        const flowchartKind = specialKind === "choice" ? FlowchartNodeKind.Decision : FlowchartNodeKind.Process;
        return makeNode(name, label ?? name, flowchartKind);
    }

    function getOrCreatePseudoState(role: "start" | "end"): string {
        const ctx = compositeStack.length > 0 ? compositeStack[compositeStack.length - 1] : "";
        const cache = role === "start" ? startNodes : endNodes;
        if (cache.has(ctx)) return cache.get(ctx)!;
        const nodeId = makeNode(`__${role}__${ctx || "global"}`, "[*]", FlowchartNodeKind.Terminator);
        cache.set(ctx, nodeId);
        return nodeId;
    }

    function resolveStateName(name: string, role: "source" | "target"): string {
        if (name === "[*]") return getOrCreatePseudoState(role === "source" ? "start" : "end");
        return getOrCreateState(name);
    }

    function srcAlignment(): PortAlignment {
        if (direction === "LR") return PortAlignment.Right;
        if (direction === "RL") return PortAlignment.Left;
        if (direction === "BT") return PortAlignment.Top;
        return PortAlignment.Bottom;
    }

    function tgtAlignment(): PortAlignment {
        if (direction === "LR") return PortAlignment.Left;
        if (direction === "RL") return PortAlignment.Right;
        if (direction === "BT") return PortAlignment.Bottom;
        return PortAlignment.Top;
    }

    function createPort(nodeId: string, alignment: PortAlignment): string {
        const portId = generateId();
        elements[portId] = {
            id: portId,
            type: ElementType.ClassPort,
            nodeId,
            links: [],
            depthRatio: 50,
            latitude: 10,
            longitude: 10
        } as PortState;
        (elements[nodeId] as NodeState).ports.push(portId);
        ports[portId] = {alignment, edgePosRatio: 50};
        return portId;
    }

    function createTransition(sourceId: string, targetId: string, label?: string): void {
        const linkId = generateId();
        const srcPortId = createPort(sourceId, srcAlignment());
        const tgtPortId = createPort(targetId, tgtAlignment());

        elements[linkId] = {
            id: linkId,
            type: ElementType.ClassLink,
            port1: srcPortId,
            port2: tgtPortId,
            tipStyle1: TipStyle.None,
            tipStyle2: TipStyle.Arrow,
            routeStyle: RouteStyle.OrthogonalSquare,
            cornerStyle: CornerStyle.Straight,
            colorSchema: defaultColorSchema,
            text: label?.trim() || undefined
        } as LinkState;

        (elements[srcPortId] as PortState).links.push(linkId);
        (elements[tgtPortId] as PortState).links.push(linkId);
        links[linkId] = {};
        layoutEdges.push({source: sourceId, target: targetId});
    }

    for (const line of lines) {
        const lower = line.toLowerCase();

        if (lower.startsWith("statediagram")) continue;
        if (line.trim() === "--") continue;
        if (lower.startsWith("classdef") || (lower.startsWith("class ") && !lower.startsWith("classdiagram"))) continue;
        if (lower.startsWith("note") || lower.startsWith("end note")) continue;

        const dirMatch = line.match(/^direction\s+(TB|BT|LR|RL)\b/i);
        if (dirMatch) {
            direction = dirMatch[1].toUpperCase() as LayoutDirection;
            continue;
        }

        if (/^}\s*$/.test(line)) {
            compositeStack.pop();
            continue;
        }

        // Composite state block: state id { or state "Label" as id {
        const compositeMatch = line.match(/^state\s+(?:"([^"]+)"\s+as\s+)?([\w-]+)\s*\{/);
        if (compositeMatch) {
            const [, label, id] = compositeMatch;
            const key = clusterKey(id);
            const parentKey = currentClusterKey();
            if (parentKey) clusterParents[key] = parentKey;
            clusterDefs[key] = {label: label ?? id};
            compositeStack.push(id);
            continue;
        }

        // State with label: state "Label" as id
        const labelMatch = line.match(/^state\s+"([^"]+)"\s+as\s+([\w-]+)\s*$/);
        if (labelMatch) {
            const [, label, id] = labelMatch;
            getOrCreateState(id, label);
            continue;
        }

        // Special state: state id <<fork|join|choice>>
        const specialMatch = line.match(/^state\s+([\w-]+)\s+<<(fork|join|choice)>>\s*$/i);
        if (specialMatch) {
            const [, id, kind] = specialMatch;
            getOrCreateState(id, id, kind.toLowerCase() as SpecialKind);
            continue;
        }

        // Transition: A --> B or A --> B : label
        const transitionMatch = line.match(/^([\w-]+|\[\*\])\s*-->\s*([\w-]+|\[\*\])\s*(?::\s*(.*))?$/);
        if (transitionMatch) {
            const [, from, to, label] = transitionMatch;
            createTransition(resolveStateName(from, "source"), resolveStateName(to, "target"), label);
            continue;
        }
    }

    const hints = direction ? {direction} : {};
    const clusterBoundsById = applyAutoLayout(nodes, layoutEdges, hints, clusterDefs, nodeParents, clusterParents);

    const clusters: { [id: string]: ClusterPlacement } = {};
    for (const [key, bounds] of Object.entries(clusterBoundsById)) {
        clusters[key] = {bounds, label: clusterDefs[key]?.label ?? key};
    }

    let maxRight = 800;
    let maxBottom = 600;
    for (const n of Object.values(nodes)) {
        if (!n?.bounds) continue;
        maxRight = Math.max(maxRight, n.bounds.x + n.bounds.width);
        maxBottom = Math.max(maxBottom, n.bounds.y + n.bounds.height);
    }
    for (const b of Object.values(clusterBoundsById)) {
        if (!b) continue;
        maxRight = Math.max(maxRight, b.x + b.width);
        maxBottom = Math.max(maxBottom, b.y + b.height);
    }

    return {
        ...baseDiagram,
        type: ElementType.FlowchartDiagram,
        elements,
        nodes,
        ports,
        links,
        clusters: Object.keys(clusters).length > 0 ? clusters : undefined,
        notes: {},
        selectedElements: [],
        display: {
            ...baseDiagram.display,
            width: maxRight + 80,
            height: maxBottom + 80,
            offset: {x: 0, y: 0}
        }
    } as any as StructureDiagramState;
}
