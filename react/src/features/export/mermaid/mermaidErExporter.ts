import {Diagram} from "../../../common/model";
import {
    DiagramElement,
    ErCardinality,
    ErRelationshipState,
    Id,
    LinkState,
    NodeState,
    PortState
} from "../../../package/packageModel";
import {ElementResolver} from "../CloudDiagramFormat";
import {ErDiagramState} from "../../erDiagram/erDiagramModel";
import {formatErAttribute} from "../../erDiagram/erDiagramUtils";

interface ExportableErEntity {
    id: Id;
    node: NodeState;
    mermaidId: string;
    x: number;
    y: number;
}

export function exportErDiagramAsMermaid(diagram: Diagram, resolveElement?: ElementResolver): string {
    const erDiagram = diagram as ErDiagramState;
    const entities = collectErEntities(erDiagram, resolveElement);
    const entityIdByNodeId = new Map(entities.map(entity => [entity.id, entity.mermaidId]));
    const lines = ["erDiagram"];

    if (erDiagram.er?.direction) {
        lines.push(`    direction ${erDiagram.er.direction}`);
    }

    entities.forEach(({node, mermaidId}) => {
        lines.push(...exportErEntity(mermaidId, node));
    });

    Object.keys(erDiagram.links).forEach(linkId => {
        const line = exportErRelationship(erDiagram, linkId, entityIdByNodeId, resolveElement);
        if (line) {
            lines.push(line);
        }
    });

    return `${lines.join("\n")}\n`;
}

function collectErEntities(diagram: ErDiagramState, resolveElement?: ElementResolver): ExportableErEntity[] {
    const usedIds = new Set<string>();
    return Object.entries(diagram.nodes)
        .map(([nodeId, placement]) => {
            const node = resolveDiagramElement(diagram, nodeId, resolveElement) as NodeState | undefined;
            if (!node?.erEntity) return undefined;

            const baseId = sanitizeErId(node.erEntity.entityId) || sanitizeErId(node.text) || sanitizeErId(nodeId) || "Entity";
            const mermaidId = uniqueMermaidId(baseId, usedIds);
            return {
                id: nodeId,
                node,
                mermaidId,
                x: placement.bounds.x,
                y: placement.bounds.y
            };
        })
        .filter((entity): entity is ExportableErEntity => entity !== undefined)
        .sort((a, b) => a.y - b.y || a.x - b.x);
}

function exportErEntity(mermaidId: string, node: NodeState): string[] {
    const entity = node.erEntity!;
    const alias = entity.alias && entity.alias !== mermaidId
        ? `["${escapeMermaidString(entity.alias)}"]`
        : "";
    const attributes = entity.attributes.filter(attribute => attribute.type || attribute.name);

    if (attributes.length === 0) {
        return [`    ${mermaidId}${alias}`];
    }

    return [
        `    ${mermaidId}${alias} {`,
        ...attributes.map(attribute => `        ${formatErAttribute(attribute)}`),
        "    }"
    ];
}

function exportErRelationship(
    diagram: ErDiagramState,
    linkId: Id,
    entityIdByNodeId: Map<Id, string>,
    resolveElement?: ElementResolver
): string | undefined {
    const link = resolveDiagramElement(diagram, linkId, resolveElement) as LinkState | undefined;
    if (!link) return undefined;

    const sourcePort = resolveDiagramElement(diagram, link.port1, resolveElement) as PortState | undefined;
    const targetPort = resolveDiagramElement(diagram, link.port2, resolveElement) as PortState | undefined;
    if (!sourcePort || !targetPort) return undefined;

    const sourceId = entityIdByNodeId.get(sourcePort.nodeId);
    const targetId = entityIdByNodeId.get(targetPort.nodeId);
    if (!sourceId || !targetId) return undefined;

    const relationship = link.erRelationship ?? defaultErRelationship(link);
    const lineStyle = relationship.identifying ? "--" : "..";
    return `    ${sourceId} ${relationship.sourceCardinality}${lineStyle}${toMermaidTargetCardinality(relationship.targetCardinality)} ${targetId} : ${sanitizeRelationLabel(relationship.label)}`;
}

function defaultErRelationship(link: LinkState): ErRelationshipState {
    return {
        sourceCardinality: "||",
        targetCardinality: "}o",
        identifying: true,
        label: link.text ?? "relates to"
    };
}

function toMermaidTargetCardinality(cardinality: ErCardinality): string {
    switch (cardinality) {
        case "||":
            return "||";
        case "|o":
            return "o|";
        case "}o":
            return "o{";
        case "}|":
            return "|{";
        default:
            return "||";
    }
}

function resolveDiagramElement(diagram: Diagram, id: Id, resolveElement?: ElementResolver): DiagramElement | undefined {
    const embeddedElements = (diagram as Diagram & { elements?: Record<Id, DiagramElement> }).elements ?? {};
    return embeddedElements[id] ?? resolveElement?.(id);
}

function uniqueMermaidId(baseId: string, usedIds: Set<string>): string {
    let nextId = baseId;
    let suffix = 2;
    while (usedIds.has(nextId)) {
        nextId = `${baseId}_${suffix}`;
        suffix++;
    }
    usedIds.add(nextId);
    return nextId;
}

function sanitizeErId(value: string): string {
    return value.trim().replace(/\s+/g, "_").replace(/[^\p{L}\p{N}_-]/gu, "");
}

function sanitizeRelationLabel(value: string): string {
    return value.replace(/[\r\n]+/g, " ").trim() || "relates to";
}

function escapeMermaidString(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}
