import {
    type BpmnActivity,
    type BpmnDiagram,
    type BpmnEvent,
    type BpmnFlow,
    type BpmnGateway,
    type BpmnLane,
    type BpmnNode,
    type BpmnPool,
    type BpmnProcess,
    type BpmnNodePlacement,
    BpmnElementKind,
    BpmnEventDefinition,
    BpmnFlowKind,
    BpmnGatewayDirection,
    BpmnPoolOrientation,
    defaultDiagramDisplay,
    exportBpmnDiagram,
    type LinkState,
    type NodeState,
    ElementType,
} from "@benkalegin/doodles-api";
import {Diagram} from "../../common/model";
import {ElementResolver} from "./CloudDiagramFormat";
import {StructureDiagramState} from "../structureDiagram/structureDiagramState";

/**
 * Export a clouddiagram BPMN diagram (StructureDiagramState whose elements
 * carry the bpmnNode / bpmnFlow discriminators) as BPMN 2.0 XML via the
 * doodles-bpmn exporter. Phase 2b MVP — emits shape bounds; flow waypoints
 * are omitted so downstream consumers auto-layout.
 */
export function exportClouddiagramAsBpmn(diagram: Diagram, resolveElement: ElementResolver | undefined): string {
    if (!resolveElement) throw new Error("BPMN export requires element resolution");
    return exportBpmnDiagram(buildBpmnDiagram(diagram as StructureDiagramState, resolveElement));
}

function buildBpmnDiagram(structure: StructureDiagramState, resolveElement: ElementResolver): BpmnDiagram {
    const nodes: Record<string, BpmnNode> = {};
    const nodePlacements: Record<string, BpmnNodePlacement> = {};
    const flows: Record<string, BpmnFlow> = {};
    const processes: Record<string, BpmnProcess> = {};

    for (const [nodeId, placement] of Object.entries(structure.nodes)) {
        const element = resolveElement(nodeId);
        if (!isBpmnNodeState(element)) continue;
        const bpmnNode = convertNode(nodeId, element);
        if (!bpmnNode) continue;
        nodes[nodeId] = bpmnNode;
        nodePlacements[nodeId] = bpmnPlacement(bpmnNode, placement.bounds);
    }

    for (const linkId of Object.keys(structure.links)) {
        const element = resolveElement(linkId);
        if (!isBpmnLinkState(element)) continue;
        const flow = convertFlow(linkId, element, resolveElement);
        if (flow) flows[linkId] = flow;
    }

    derivePoolMembership(nodes, structure, resolveElement);
    ensureProcesses(nodes, processes);

    return {
        id: structure.id ?? "Definitions_1",
        type: ElementType.BpmnDiagram,
        kind: "bpmn",
        display: {...defaultDiagramDisplay},
        processes,
        nodes,
        flows,
        nodePlacements,
        flowPlacements: {},
        hasLayout: Object.keys(nodePlacements).length > 0,
    };
}

// ── Type guards ────────────────────────────────────────────────────────────

function isBpmnNodeState(el: unknown): el is NodeState {
    return !!el && typeof el === "object" && "bpmnNode" in el && (el as NodeState).bpmnNode !== undefined;
}

function isBpmnLinkState(el: unknown): el is LinkState {
    return !!el && typeof el === "object" && "bpmnFlow" in el && (el as LinkState).bpmnFlow !== undefined;
}

// ── Node conversion ───────────────────────────────────────────────────────

function convertNode(id: string, element: NodeState): BpmnNode | undefined {
    const bpmn = element.bpmnNode!;
    if (bpmn.kind === BpmnElementKind.Pool) return convertPool(id, element);
    if (bpmn.kind === BpmnElementKind.Lane) return convertLane(id, element);
    if (isActivityKind(bpmn.kind)) return convertActivity(id, element);
    if (isEventKind(bpmn.kind)) return convertEvent(id, element);
    if (isGatewayKind(bpmn.kind)) return convertGateway(id, element);
    return undefined;
}

function convertPool(id: string, element: NodeState): BpmnPool {
    const out: BpmnPool = {
        id,
        kind: BpmnElementKind.Pool,
        orientation: element.bpmnNode?.isHorizontal === false ? BpmnPoolOrientation.Vertical : BpmnPoolOrientation.Horizontal,
    };
    if (element.text) out.name = element.text;
    if (element.bpmnNode?.processRef) out.processRef = element.bpmnNode.processRef;
    return out;
}

function convertLane(id: string, element: NodeState): BpmnLane {
    const out: BpmnLane = {
        id,
        kind: BpmnElementKind.Lane,
        flowNodeRefs: element.memberNodeIds ?? [],
    };
    if (element.text) out.name = element.text;
    return out;
}

function convertActivity(id: string, element: NodeState): BpmnActivity {
    const out: BpmnActivity = {id, kind: element.bpmnNode!.kind as BpmnActivity["kind"]};
    if (element.text) out.name = element.text;
    return out;
}

function convertEvent(id: string, element: NodeState): BpmnEvent {
    const out: BpmnEvent = {
        id,
        kind: element.bpmnNode!.kind as BpmnEvent["kind"],
        eventDefinition: element.bpmnNode?.eventDefinition ?? BpmnEventDefinition.None,
    };
    if (element.text) out.name = element.text;
    return out;
}

function convertGateway(id: string, element: NodeState): BpmnGateway {
    const out: BpmnGateway = {
        id,
        kind: element.bpmnNode!.kind as BpmnGateway["kind"],
        direction: element.bpmnNode?.gatewayDirection ?? BpmnGatewayDirection.Unspecified,
    };
    if (element.text) out.name = element.text;
    return out;
}

function bpmnPlacement(node: BpmnNode, bounds: BpmnNodePlacement["bounds"]): BpmnNodePlacement {
    const out: BpmnNodePlacement = {bounds};
    if (node.kind === BpmnElementKind.Pool) {
        out.isHorizontal = (node as BpmnPool).orientation === BpmnPoolOrientation.Horizontal;
    } else if (node.kind === BpmnElementKind.Lane) {
        out.isHorizontal = true;
    }
    return out;
}

// ── Pool membership ───────────────────────────────────────────────────────

/**
 * Resolve lane → flow-node membership from the cluster `memberNodeIds`
 * relationships, and stamp parentRef on every flow node so the writer can
 * group nodes under their containing process/lane.
 */
function derivePoolMembership(
    bpmnNodes: Record<string, BpmnNode>,
    structure: StructureDiagramState,
    resolveElement: ElementResolver,
): void {
    for (const lane of Object.values(bpmnNodes)) {
        if (lane.kind !== BpmnElementKind.Lane) continue;
        const cluster = resolveElement(lane.id) as NodeState | undefined;
        const memberIds = cluster?.memberNodeIds ?? [];
        (lane as BpmnLane).flowNodeRefs = memberIds.filter(id => bpmnNodes[id] !== undefined);
        for (const memberId of (lane as BpmnLane).flowNodeRefs) {
            bpmnNodes[memberId]!.parentRef = lane.id;
        }
    }
    // Tag pool→lane parentRef on lanes themselves.
    for (const pool of Object.values(bpmnNodes)) {
        if (pool.kind !== BpmnElementKind.Pool) continue;
        const cluster = resolveElement(pool.id) as NodeState | undefined;
        for (const memberId of cluster?.memberNodeIds ?? []) {
            const member = bpmnNodes[memberId];
            if (member?.kind === BpmnElementKind.Lane) member.parentRef = (pool as BpmnPool).processRef ?? pool.id;
        }
    }
    // Nodes not in any lane get the process id (if pool present) as parentRef.
    const pools = Object.values(bpmnNodes).filter(n => n.kind === BpmnElementKind.Pool) as BpmnPool[];
    const defaultProcessId = pools[0]?.processRef;
    for (const node of Object.values(bpmnNodes)) {
        if (isContainerKind(node.kind)) continue;
        if (node.parentRef) continue;
        if (defaultProcessId) node.parentRef = defaultProcessId;
    }
    void structure;
}

function ensureProcesses(bpmnNodes: Record<string, BpmnNode>, processes: Record<string, BpmnProcess>): void {
    const pools = Object.values(bpmnNodes).filter(n => n.kind === BpmnElementKind.Pool) as BpmnPool[];
    for (const pool of pools) {
        if (pool.processRef && !processes[pool.processRef]) {
            processes[pool.processRef] = {id: pool.processRef, isExecutable: true};
        }
    }
    if (Object.keys(processes).length === 0) {
        processes["Process_1"] = {id: "Process_1", isExecutable: true};
        for (const node of Object.values(bpmnNodes)) {
            if (isContainerKind(node.kind)) continue;
            if (!node.parentRef) node.parentRef = "Process_1";
        }
    }
}

// ── Flow conversion ───────────────────────────────────────────────────────

function convertFlow(id: string, element: LinkState, resolveElement: ElementResolver): BpmnFlow | undefined {
    const bpmn = element.bpmnFlow!;
    const sourceRef = nodeIdOfPort(element.port1, resolveElement);
    const targetRef = nodeIdOfPort(element.port2, resolveElement);
    if (!sourceRef || !targetRef) return undefined;
    const out: BpmnFlow = {id, kind: bpmn.kind as BpmnFlowKind, sourceRef, targetRef};
    if (element.text) out.name = element.text;
    if (bpmn.condition) out.condition = bpmn.condition;
    return out;
}

function nodeIdOfPort(portId: string | undefined, resolveElement: ElementResolver): string | undefined {
    if (!portId) return undefined;
    const port = resolveElement(portId);
    if (port && typeof port === "object" && "nodeId" in port) return (port as {nodeId: string}).nodeId;
    return undefined;
}

// ── Kind predicates ────────────────────────────────────────────────────────

function isActivityKind(kind: string): boolean {
    return kind === BpmnElementKind.Task
        || kind === BpmnElementKind.UserTask
        || kind === BpmnElementKind.ServiceTask
        || kind === BpmnElementKind.Subprocess
        || kind === BpmnElementKind.CallActivity;
}

function isEventKind(kind: string): boolean {
    return kind === BpmnElementKind.StartEvent
        || kind === BpmnElementKind.EndEvent
        || kind === BpmnElementKind.IntermediateThrowEvent
        || kind === BpmnElementKind.IntermediateCatchEvent;
}

function isGatewayKind(kind: string): boolean {
    return kind === BpmnElementKind.ExclusiveGateway
        || kind === BpmnElementKind.ParallelGateway
        || kind === BpmnElementKind.InclusiveGateway
        || kind === BpmnElementKind.EventBasedGateway;
}

function isContainerKind(kind: string): boolean {
    return kind === BpmnElementKind.Pool || kind === BpmnElementKind.Lane;
}
