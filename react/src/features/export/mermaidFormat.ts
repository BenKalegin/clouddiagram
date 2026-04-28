import {Diagram} from "../../common/model";
import {importMermaidGanttDiagram} from "./mermaid/mermaidGanttImporter";
import {importMermaidSequenceDiagram} from "./mermaid/mermaidSequenceImporter";
import {
    importMermaidFlowchartDiagram,
    importMermaidStructureDiagram
} from "./mermaid/mermaidStructureImporter";
import {importMermaidSourceAsNote} from "./mermaid/mermaidFallbackImporter";
import {
    MermaidDiagramKind,
    MermaidDiagramTypeDefinition,
    MermaidDiagramTypeRegistryEntry
} from "./mermaid/mermaidImportTypes";
import {mermaidSourceLines, normalizeMermaidDeclaration} from "./mermaid/mermaidImportUtils";

export type {MermaidDiagramKind, MermaidDiagramTypeDefinition};
export {importMermaidGanttDiagram};
export {importMermaidSequenceDiagram};
export {importMermaidFlowchartDiagram, importMermaidStructureDiagram};

const mermaidDiagramTypeRegistry: MermaidDiagramTypeRegistryEntry[] = [
    { kind: "flowchart", name: "Flowchart", declarations: ["flowchart", "graph"], importer: importMermaidFlowchartDiagram },
    { kind: "sequence", name: "Sequence Diagram", declarations: ["sequencediagram"], importer: importMermaidSequenceDiagram },
    { kind: "class", name: "Class Diagram", declarations: ["classdiagram"], importer: importMermaidStructureDiagram },
    { kind: "state", name: "State Diagram", declarations: ["statediagram-v2", "statediagram"] },
    { kind: "er", name: "Entity Relationship Diagram", declarations: ["erdiagram"] },
    { kind: "journey", name: "User Journey", declarations: ["journey"] },
    { kind: "gantt", name: "Gantt", declarations: ["gantt"], importer: importMermaidGanttDiagram },
    { kind: "pie", name: "Pie Chart", declarations: ["pie"] },
    { kind: "quadrant", name: "Quadrant Chart", declarations: ["quadrantchart"] },
    { kind: "requirement", name: "Requirement Diagram", declarations: ["requirementdiagram"] },
    { kind: "gitgraph", name: "GitGraph Diagram", declarations: ["gitgraph"] },
    { kind: "c4", name: "C4 Diagram", declarations: ["c4context", "c4container", "c4component", "c4dynamic", "c4deployment"], importer: importMermaidFlowchartDiagram },
    { kind: "mindmap", name: "Mindmap", declarations: ["mindmap"] },
    { kind: "timeline", name: "Timeline", declarations: ["timeline"] },
    { kind: "zenuml", name: "ZenUML", declarations: ["zenuml"] },
    { kind: "sankey", name: "Sankey", declarations: ["sankey-beta", "sankey"] },
    { kind: "xychart", name: "XY Chart", declarations: ["xychart-beta", "xychart"] },
    { kind: "block", name: "Block Diagram", declarations: ["block-beta", "block"] },
    { kind: "packet", name: "Packet", declarations: ["packet-beta", "packet"] },
    { kind: "kanban", name: "Kanban", declarations: ["kanban"] },
    { kind: "architecture", name: "Architecture", declarations: ["architecture-beta", "architecture"] },
    { kind: "radar", name: "Radar", declarations: ["radar-beta", "radar"] },
    { kind: "treemap", name: "Treemap", declarations: ["treemap-beta", "treemap"] },
    { kind: "venn", name: "Venn", declarations: ["venn"] },
    { kind: "ishikawa", name: "Ishikawa", declarations: ["ishikawa"] },
    { kind: "treeview", name: "TreeView", declarations: ["treeview"] },
];

export const mermaidDiagramTypes: MermaidDiagramTypeDefinition[] = mermaidDiagramTypeRegistry.map(toPublicMermaidDiagramType);

const mermaidDeclarationMap = new Map(
    mermaidDiagramTypeRegistry.flatMap(type => type.declarations.map(declaration => [declaration, type] as const))
);

export function detectMermaidDiagramType(content: string): MermaidDiagramTypeDefinition | undefined {
    const type = detectMermaidDiagramTypeEntry(content);
    return type ? toPublicMermaidDiagramType(type) : undefined;
}

export function importMermaidDiagram(baseDiagram: Diagram, content: string): Diagram {
    const type = detectMermaidDiagramTypeEntry(content);
    return type?.importer
        ? type.importer(baseDiagram, content)
        : importMermaidSourceAsNote(baseDiagram, content, type ? toPublicMermaidDiagramType(type) : undefined);
}

function detectMermaidDiagramTypeEntry(content: string): MermaidDiagramTypeRegistryEntry | undefined {
    const declaration = mermaidSourceLines(content).map(normalizeMermaidDeclaration)[0];
    return declaration ? mermaidDeclarationMap.get(declaration) : undefined;
}

function toPublicMermaidDiagramType(type: MermaidDiagramTypeRegistryEntry): MermaidDiagramTypeDefinition {
    return {
        kind: type.kind,
        name: type.name,
        declarations: type.declarations,
        nativeImport: !!type.importer
    };
}
