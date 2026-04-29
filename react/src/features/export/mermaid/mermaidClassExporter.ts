import {Diagram} from "../../../common/model";
import {DiagramElement, Id, LinkState, NodeState, PortState, TipStyle} from "../../../package/packageModel";
import {ElementResolver} from "../CloudDiagramFormat";
import {StructureDiagramState} from "../../structureDiagram/structureDiagramState";

interface ExportableClassNode {
    id: Id;
    node: NodeState;
    mermaidId: string;
    x: number;
    y: number;
}

export function exportClassDiagramAsMermaid(diagram: Diagram, resolveElement?: ElementResolver): string {
    const structureDiagram = diagram as StructureDiagramState;
    const classes = collectClassNodes(structureDiagram, resolveElement);
    const classIdByNodeId = new Map(classes.map(classNode => [classNode.id, classNode.mermaidId]));
    const lines = ["classDiagram"];

    classes.forEach(({node, mermaidId}) => {
        lines.push(...exportClassNode(mermaidId, node));
    });

    Object.keys(structureDiagram.links).forEach(linkId => {
        const line = exportClassLink(structureDiagram, linkId, classIdByNodeId, resolveElement);
        if (line) {
            lines.push(line);
        }
    });

    return `${lines.join("\n")}\n`;
}

function collectClassNodes(diagram: StructureDiagramState, resolveElement?: ElementResolver): ExportableClassNode[] {
    const usedIds = new Set<string>();
    return Object.entries(diagram.nodes)
        .map(([nodeId, placement]) => {
            const node = resolveDiagramElement(diagram, nodeId, resolveElement) as NodeState | undefined;
            if (!node) return undefined;
            const baseId = sanitizeClassId(node.text) || sanitizeClassId(nodeId) || "Class";
            const mermaidId = uniqueMermaidId(baseId, usedIds);
            return {
                id: nodeId,
                node,
                mermaidId,
                x: placement.bounds.x,
                y: placement.bounds.y
            };
        })
        .filter((node): node is ExportableClassNode => node !== undefined)
        .sort((a, b) => a.y - b.y || a.x - b.x);
}

function exportClassNode(mermaidId: string, node: NodeState): string[] {
    const lines: string[] = [];
    const label = node.text.trim();
    if (label && label !== mermaidId) {
        lines.push(`    class ${mermaidId}["${escapeClassLabel(label)}"]`);
    }

    const members = (node.classMembers ?? []).filter(member => member.text.trim());
    if (!node.classAnnotation && members.length === 0) {
        if (!label || label === mermaidId) {
            lines.push(`    class ${mermaidId}`);
        }
        return lines;
    }

    lines.push(`    class ${mermaidId} {`);
    if (node.classAnnotation) {
        lines.push(`        <<${node.classAnnotation}>>`);
    }
    members.forEach(member => {
        lines.push(`        ${member.text}`);
    });
    lines.push("    }");
    return lines;
}

function exportClassLink(
    diagram: StructureDiagramState,
    linkId: Id,
    classIdByNodeId: Map<Id, string>,
    resolveElement?: ElementResolver
): string | undefined {
    const link = resolveDiagramElement(diagram, linkId, resolveElement) as LinkState | undefined;
    if (!link) return undefined;

    const sourcePort = resolveDiagramElement(diagram, link.port1, resolveElement) as PortState | undefined;
    const targetPort = resolveDiagramElement(diagram, link.port2, resolveElement) as PortState | undefined;
    if (!sourcePort || !targetPort) return undefined;

    const sourceId = classIdByNodeId.get(sourcePort.nodeId);
    const targetId = classIdByNodeId.get(targetPort.nodeId);
    if (!sourceId || !targetId) return undefined;

    const label = link.text ? ` : ${escapeRelationLabel(link.text)}` : "";
    return `    ${sourceId} ${relationshipOperator(link.tipStyle2)} ${targetId}${label}`;
}

function relationshipOperator(targetTip: TipStyle): string {
    switch (targetTip) {
        case TipStyle.Triangle:
            return "<|--";
        case TipStyle.Diamond:
            return "--*";
        case TipStyle.Circle:
            return "--o";
        default:
            return "-->";
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

function sanitizeClassId(value: string): string {
    return value.trim().replace(/\s+/g, "_").replace(/[^\p{L}\p{N}_-]/gu, "");
}

function escapeClassLabel(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}

function escapeRelationLabel(value: string): string {
    return value.replace(/\s+/g, " ").replace(/[\r\n]+/g, " ").trim();
}
