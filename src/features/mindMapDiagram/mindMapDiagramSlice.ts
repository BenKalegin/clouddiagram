import {Action} from "@reduxjs/toolkit";
import {elementCommandAction, Get, KeyBindings, Set} from "../diagramEditor/diagramEditorSlice";
import {StructureDiagramHandler} from "../structureDiagram/structureDiagramHandler";
import {
    CornerStyle,
    ElementRef,
    ElementType,
    FlowchartNodeKind,
    Id,
    LinkState,
    NodeState,
    PortAlignment,
    PortState,
    RouteStyle,
    TipStyle,
} from "../../package/packageModel";
import {Coordinate} from "../../common/model";
import {autoConnectNodes} from "../structureDiagram/structureDiagramModel";
import {Command} from "../propertiesEditor/propertiesEditorModel";
import {elementsAtom, generateId} from "../diagramEditor/diagramEditorModel";
import {activeDiagramIdAtom} from "../diagramTabs/diagramTabsModel";
import {NodePlacement, PortPlacement, StructureDiagramState} from "../structureDiagram/structureDiagramState";
import {withHistory} from "../diagramEditor/historySlice";
import {defaultColorSchemaAtom} from "../../common/colors/colorSchemas";

const NEW_NODE_TEXT = "New Topic";

function getMindMapNodeSide(node: NodeState, diagram: StructureDiagramState, get: Get): 'left' | 'right' {
    for (const portId of node.ports) {
        const port = get(elementsAtom(portId)) as PortState;
        const portPlacement = diagram.ports[portId];
        if (!portPlacement) continue;
        for (const linkId of port.links) {
            const link = get(elementsAtom(linkId)) as LinkState;
            // port2 = incoming (child) end; alignment tells us which side the node is on
            if (link.port2 === portId) {
                if (portPlacement.alignment === PortAlignment.Left) return 'right';
                if (portPlacement.alignment === PortAlignment.Right) return 'left';
            }
        }
    }
    return 'right'; // root node default
}

function insertMindMapChildImpl(get: Get, set: Set, parentRef: ElementRef, overrideSide?: 'left' | 'right'): void {
    if (parentRef.type !== ElementType.ClassNode) return;

    const diagramId = get(activeDiagramIdAtom);
    const diagram = get(elementsAtom(diagramId)) as StructureDiagramState;
    const parentNode = get(elementsAtom(parentRef.id)) as NodeState;
    const parentPlacement = diagram.nodes[parentRef.id];
    if (!parentPlacement) return;

    const colorSchema = parentNode.colorSchema ?? get(defaultColorSchemaAtom);
    const side = overrideSide ?? getMindMapNodeSide(parentNode, diagram, get);
    const srcAlign = side === 'right' ? PortAlignment.Right : PortAlignment.Left;
    const tgtAlign = side === 'right' ? PortAlignment.Left : PortAlignment.Right;

    let childCount = 0;
    for (const portId of parentNode.ports) {
        const port = get(elementsAtom(portId)) as PortState;
        const portPlacement = diagram.ports[portId];
        if (!portPlacement || portPlacement.alignment !== srcAlign) continue;
        for (const linkId of port.links) {
            const link = get(elementsAtom(linkId)) as LinkState;
            if (link.port1 === portId) childCount++;
        }
    }

    const childText = NEW_NODE_TEXT;
    const childWidth = Math.max(100, childText.length * 9 + 24);
    const childHeight = 45;
    const xGap = 80;
    const yGap = childHeight + 20;
    const parentBounds = parentPlacement.bounds;
    const childX = side === 'right'
        ? parentBounds.x + parentBounds.width + xGap
        : parentBounds.x - xGap - childWidth;
    const childY = parentBounds.y + childCount * yGap;

    const childNodeId = generateId();
    const childNode: NodeState = {
        id: childNodeId,
        type: ElementType.ClassNode,
        text: childText,
        ports: [],
        colorSchema,
        flowchartKind: FlowchartNodeKind.MindMapTopic,
    };

    const linkId = generateId();
    const srcPortId = generateId();
    const tgtPortId = generateId();

    const srcPort: PortState = {
        id: srcPortId, nodeId: parentRef.id, type: ElementType.ClassPort,
        depthRatio: 50, latitude: 8, longitude: 8, links: [linkId],
    };
    const tgtPort: PortState = {
        id: tgtPortId, nodeId: childNodeId, type: ElementType.ClassPort,
        depthRatio: 50, latitude: 8, longitude: 8, links: [linkId],
    };
    const link: LinkState = {
        id: linkId, type: ElementType.ClassLink,
        port1: srcPortId, port2: tgtPortId,
        tipStyle1: TipStyle.None, tipStyle2: TipStyle.None,
        routeStyle: RouteStyle.Bezier,
        colorSchema,
        cornerStyle: CornerStyle.Straight,
    };

    set(elementsAtom(parentRef.id), {...parentNode, ports: [...parentNode.ports, srcPortId]} as NodeState);
    set(elementsAtom(childNodeId), {...childNode, ports: [tgtPortId]} as NodeState);
    set(elementsAtom(srcPortId), srcPort);
    set(elementsAtom(tgtPortId), tgtPort);
    set(elementsAtom(linkId), link);

    set(elementsAtom(diagramId), {
        ...diagram,
        nodes: {
            ...diagram.nodes,
            [childNodeId]: {bounds: {x: childX, y: childY, width: childWidth, height: childHeight}} as NodePlacement,
        },
        ports: {
            ...diagram.ports,
            [srcPortId]: {alignment: srcAlign, edgePosRatio: 50} as PortPlacement,
            [tgtPortId]: {alignment: tgtAlign, edgePosRatio: 50} as PortPlacement,
        },
        links: {...diagram.links, [linkId]: {}},
        selectedElements: [{id: childNodeId, type: ElementType.ClassNode}],
    } as StructureDiagramState);
}

function insertMindMapSiblingImpl(get: Get, set: Set, siblingRef: ElementRef): void {
    if (siblingRef.type !== ElementType.ClassNode) return;

    const siblingNode = get(elementsAtom(siblingRef.id)) as NodeState;
    const diagram = get(elementsAtom(get(activeDiagramIdAtom))) as StructureDiagramState;
    const siblingSide = getMindMapNodeSide(siblingNode, diagram, get);

    for (const portId of siblingNode.ports) {
        const port = get(elementsAtom(portId)) as PortState;
        for (const linkId of port.links) {
            const link = get(elementsAtom(linkId)) as LinkState;
            if (link.port2 === portId) {
                const parentPort = get(elementsAtom(link.port1)) as PortState;
                insertMindMapChildImpl(get, set, {id: parentPort.nodeId, type: ElementType.ClassNode}, siblingSide);
                return;
            }
        }
    }
    insertMindMapChildImpl(get, set, siblingRef, siblingSide);
}

export const insertMindMapChild = withHistory(insertMindMapChildImpl, "Insert Mind Map Child");
export const insertMindMapSibling = withHistory(insertMindMapSiblingImpl, "Insert Mind Map Sibling");

class MindMapDiagramHandler extends StructureDiagramHandler {
    getKeyBindings(): KeyBindings {
        return {
            ...super.getKeyBindings(),
            'Tab':   Command.InsertChild,
            'Enter': Command.InsertSibling,
        };
    }

    handleAction(action: Action, get: Get, set: Set): void {
        if (elementCommandAction.match(action)) {
            const {command, elements} = action.payload;
            if (command === Command.InsertChild && elements.length > 0) {
                insertMindMapChild(get, set, elements[0]);
                return;
            }
            if (command === Command.InsertSibling && elements.length > 0) {
                insertMindMapSibling(get, set, elements[0]);
                return;
            }
        }
        super.handleAction(action, get, set);
    }

    connectNodes(get: Get, set: Set, sourceId: Id, target: ElementRef, diagramPos: Coordinate): void {
        autoConnectNodes(get, set, sourceId, target, {
            routeStyle: RouteStyle.Bezier,
            tipStyle1: TipStyle.None,
            tipStyle2: TipStyle.None,
        });
    }
}

export const mindMapDiagramEditor = new MindMapDiagramHandler();
