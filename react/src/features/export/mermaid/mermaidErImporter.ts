import {Diagram} from "../../../common/model";
import {
    CornerStyle,
    ElementType,
    ErCardinality,
    ErRelationshipState,
    LinkState,
    NodeState,
    PortAlignment,
    PortState,
    RouteStyle,
    TipStyle
} from "../../../package/packageModel";
import {defaultColorSchema} from "../../../common/colors/colorSchemas";
import {createMermaidIdGenerator, MermaidIdGenerator, mermaidSourceLines} from "./mermaidImportUtils";
import {ErDiagramDirection, ErDiagramState} from "../../erDiagram/erDiagramModel";
import {
    createErEntity,
    erBoundsForAttributeCount,
    getErEntityDisplayName,
    normalizeErAlias,
    parseErAttributeLine
} from "../../erDiagram/erDiagramUtils";

interface ParsedEntityRef {
    id: string;
    alias?: string;
}

const erCardinalityPattern = String.raw`(?:\|\||\|o|o\||\}o|o\{|\}\||\|\{)`;
const erEntityPattern = String.raw`[\w-]+`;

export function importMermaidErDiagram(baseDiagram: Diagram, content: string): Diagram {
    const generateId = createMermaidIdGenerator();
    const lines = mermaidSourceLines(content);
    const headerLine = lines.find(line => line.toLowerCase().startsWith("erdiagram"));
    if (!headerLine) {
        throw new Error("Not a valid Mermaid ER diagram");
    }

    const elements: { [id: string]: any } = {};
    const nodes: { [id: string]: any } = {};
    const ports: { [id: string]: any } = {};
    const links: { [id: string]: any } = {};
    const entityNodeIds = new Map<string, string>();
    let nodeIndex = 0;
    let direction: ErDiagramDirection | undefined;
    let currentEntityId: string | undefined;

    const getOrCreateNode = (entityId: string, alias?: string): string => {
        const normalizedEntityId = entityId.trim();
        const existingNodeId = entityNodeIds.get(normalizedEntityId);
        if (existingNodeId) {
            if (alias) {
                const node = elements[existingNodeId] as NodeState;
                const updatedEntity = {...node.erEntity!, alias: normalizeErAlias(alias)};
                elements[existingNodeId] = {
                    ...node,
                    text: getErEntityDisplayName(updatedEntity),
                    erEntity: updatedEntity
                } as NodeState;
            }
            return existingNodeId;
        }

        const nodeId = generateId();
        const nodeWidth = 180;
        const nodeHeight = 76;
        const nodesPerRow = 4;
        const spacingX = 90;
        const spacingY = 110;
        const row = Math.floor(nodeIndex / nodesPerRow);
        const col = nodeIndex % nodesPerRow;
        const erEntity = createErEntity(normalizedEntityId, alias);
        const node: NodeState = {
            id: nodeId,
            type: ElementType.ClassNode,
            text: getErEntityDisplayName(erEntity),
            ports: [],
            colorSchema: defaultColorSchema,
            erEntity
        };

        elements[nodeId] = node;
        nodes[nodeId] = {
            bounds: {
                x: 100 + col * (nodeWidth + spacingX),
                y: 120 + row * (nodeHeight + spacingY),
                width: nodeWidth,
                height: nodeHeight
            }
        };
        entityNodeIds.set(normalizedEntityId, nodeId);
        nodeIndex++;
        return nodeId;
    };

    const setEntityAttributes = (entityId: string, attributeLines: string[]) => {
        const nodeId = getOrCreateNode(entityId);
        const node = elements[nodeId] as NodeState;
        const updatedNode: NodeState = {
            ...node,
            erEntity: {
                ...node.erEntity!,
                attributes: attributeLines.map(parseErAttributeLine)
            }
        };
        elements[nodeId] = updatedNode;
        nodes[nodeId].bounds = erBoundsForAttributeCount(nodes[nodeId].bounds, updatedNode);
    };

    const attributesByEntity = new Map<string, string[]>();

    for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.startsWith("erdiagram")) continue;

        const directionMatch = line.match(/^direction\s+(TB|BT|LR|RL)\s*$/i);
        if (directionMatch) {
            direction = directionMatch[1].toUpperCase() as ErDiagramDirection;
            continue;
        }

        if (currentEntityId) {
            if (/^}\s*;?$/.test(line)) {
                setEntityAttributes(currentEntityId, attributesByEntity.get(currentEntityId) ?? []);
                currentEntityId = undefined;
            } else {
                const existing = attributesByEntity.get(currentEntityId) ?? [];
                attributesByEntity.set(currentEntityId, [...existing, line]);
            }
            continue;
        }

        const relationship = parseErRelationship(line);
        if (relationship) {
            const sourceNodeId = getOrCreateNode(relationship.source.id, relationship.source.alias);
            const targetNodeId = getOrCreateNode(relationship.target.id, relationship.target.alias);
            createErRelationshipLink(
                elements,
                ports,
                links,
                sourceNodeId,
                targetNodeId,
                relationship.relationship,
                generateId
            );
            continue;
        }

        const blockMatch = line.match(/^([\w-]+)(?:\s*\[\s*["`]?(.+?)["`]?\s*\])?\s*\{\s*$/);
        if (blockMatch) {
            const [, entityId, alias] = blockMatch;
            getOrCreateNode(entityId, alias);
            currentEntityId = entityId;
            attributesByEntity.set(entityId, []);
            continue;
        }

        const entityMatch = line.match(/^([\w-]+)(?:\s*\[\s*["`]?(.+?)["`]?\s*\])?\s*;?$/);
        if (entityMatch) {
            const [, entityId, alias] = entityMatch;
            getOrCreateNode(entityId, alias);
        }
    }

    if (currentEntityId) {
        setEntityAttributes(currentEntityId, attributesByEntity.get(currentEntityId) ?? []);
    }

    return {
        ...baseDiagram,
        type: ElementType.ErDiagram,
        er: {direction},
        elements,
        nodes,
        ports,
        links,
        notes: {},
        selectedElements: [],
        display: {
            ...baseDiagram.display,
            width: Math.max(1600, 100 + Math.min(nodeIndex, 4) * 270),
            height: Math.max(1000, 160 + Math.ceil(Math.max(nodeIndex, 1) / 4) * 190),
            offset: {x: 0, y: 0}
        }
    } as ErDiagramState & { elements: { [id: string]: any } };
}

function parseErRelationship(line: string): {
    source: ParsedEntityRef;
    target: ParsedEntityRef;
    relationship: ErRelationshipState;
} | undefined {
    const relationshipPattern = new RegExp(
        `^(${erEntityPattern})(?:\\s*\\[\\s*["\`]?(.+?)["\`]?\\s*\\])?\\s+(${erCardinalityPattern})\\s*(--|\\.\\.)\\s*(${erCardinalityPattern})\\s+(${erEntityPattern})(?:\\s*\\[\\s*["\`]?(.+?)["\`]?\\s*\\])?\\s*:\\s*(.*?)\\s*;?$`
    );
    const match = line.match(relationshipPattern);
    if (!match) return undefined;

    const [, sourceId, sourceAlias, sourceCardinality, lineStyle, targetCardinality, targetId, targetAlias, label] = match;
    return {
        source: {id: sourceId, alias: normalizeErAlias(sourceAlias)},
        target: {id: targetId, alias: normalizeErAlias(targetAlias)},
        relationship: {
            sourceCardinality: toInternalErCardinality(sourceCardinality),
            targetCardinality: toInternalErCardinality(targetCardinality),
            identifying: lineStyle === "--",
            label: label.trim()
        }
    };
}

function toInternalErCardinality(value: string): ErCardinality {
    switch (value) {
        case "||":
            return "||";
        case "|o":
        case "o|":
            return "|o";
        case "}o":
        case "o{":
            return "}o";
        case "}|":
        case "|{":
            return "}|";
        default:
            return "||";
    }
}

function createPort(
    elements: { [id: string]: any },
    ports: { [id: string]: any },
    nodeId: string,
    alignment: PortAlignment,
    linkId: string,
    generateId: MermaidIdGenerator
): string {
    const portId = generateId();
    elements[portId] = {
        id: portId,
        type: ElementType.ClassPort,
        nodeId,
        links: [linkId],
        depthRatio: 50,
        latitude: 10,
        longitude: 10
    } as PortState;

    (elements[nodeId] as NodeState).ports.push(portId);
    ports[portId] = {alignment, edgePosRatio: 50};
    return portId;
}

function createErRelationshipLink(
    elements: { [id: string]: any },
    ports: { [id: string]: any },
    links: { [id: string]: any },
    sourceNodeId: string,
    targetNodeId: string,
    relationship: ErRelationshipState,
    generateId: MermaidIdGenerator
): void {
    const linkId = generateId();
    const sourcePortId = createPort(elements, ports, sourceNodeId, PortAlignment.Right, linkId, generateId);
    const targetPortId = createPort(elements, ports, targetNodeId, PortAlignment.Left, linkId, generateId);

    elements[linkId] = {
        id: linkId,
        type: ElementType.ClassLink,
        port1: sourcePortId,
        port2: targetPortId,
        tipStyle1: TipStyle.None,
        tipStyle2: TipStyle.None,
        routeStyle: RouteStyle.Direct,
        cornerStyle: CornerStyle.Straight,
        colorSchema: defaultColorSchema,
        text: relationship.label,
        erRelationship: relationship
    } as LinkState;

    links[linkId] = {};
}
